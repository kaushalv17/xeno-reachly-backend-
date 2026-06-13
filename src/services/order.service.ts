import { prisma } from "../config/db"
import { OrderInput } from "../validators/order.schema"
import { ApiError } from "../utils/ApiError"

async function resolveCustomerId(input: OrderInput): Promise<string> {
	if (input.customerId) {
		const exists = await prisma.customer.findUnique({ where: { id: input.customerId } })
		if (!exists) throw ApiError.badRequest(`Customer not found: ${input.customerId}`)
		return input.customerId
	}
	const byEmail = await prisma.customer.findUnique({ where: { email: input.email! } })
	if (!byEmail) throw ApiError.badRequest(`Customer not found for email: ${input.email}`)
	return byEmail.id
}

// Roll up totalSpend / orderCount / lastOrderAt from the customer's orders
export async function recomputeCustomerAggregates(customerId: string) {
	const agg = await prisma.order.aggregate({
		where: { customerId },
		_sum: { amount: true },
		_count: { _all: true },
		_max: { createdAt: true },
	})
	await prisma.customer.update({
		where: { id: customerId },
		data: {
			totalSpend: agg._sum.amount ?? 0,
			orderCount: agg._count._all,
			lastOrderAt: agg._max.createdAt ?? null,
		},
	})
}

export const orderService = {
	async createMany(inputs: OrderInput[]) {
		const created = []
		const affected = new Set<string>()
		for (const input of inputs) {
			const customerId = await resolveCustomerId(input)
			const order = await prisma.order.create({
				data: {
					customerId,
					amount: input.amount,
					items: input.items,
					status: input.status ?? "completed",
					...(input.createdAt ? { createdAt: new Date(input.createdAt) } : {}),
				},
			})
			created.push(order)
			affected.add(customerId)
		}
		// Recompute once per affected customer (not per order) — efficient for bulk
		await Promise.all([...affected].map((id) => recomputeCustomerAggregates(id)))
		return created
	},

	async list({ skip = 0, take = 50 }: { skip?: number; take?: number } = {}) {
		const [items, total] = await Promise.all([
			prisma.order.findMany({
				skip,
				take,
				orderBy: { createdAt: "desc" },
				include: { customer: true },
			}),
			prisma.order.count(),
		])
		return { items, total, skip, take }
	},
}