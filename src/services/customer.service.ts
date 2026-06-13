import { prisma } from "../config/db"
import { CustomerInput } from "../validators/customer.schema"

export const customerService = {
	// Upsert by email so re-ingesting the same customer never duplicates
	async upsertMany(inputs: CustomerInput[]) {
		const results = []
		for (const input of inputs) {
			const customer = await prisma.customer.upsert({
				where: { email: input.email },
				create: {
					name: input.name,
					email: input.email,
					phone: input.phone,
					city: input.city,
					country: input.country ?? "India",
					tags: input.tags ?? [],
				},
				update: {
					name: input.name,
					phone: input.phone,
					city: input.city,
					...(input.country ? { country: input.country } : {}),
					...(input.tags ? { tags: input.tags } : {}),
				},
			})
			results.push(customer)
		}
		return results
	},

	async list({ skip = 0, take = 50 }: { skip?: number; take?: number } = {}) {
		const [items, total] = await Promise.all([
			prisma.customer.findMany({ skip, take, orderBy: { totalSpend: "desc" } }),
			prisma.customer.count(),
		])
		return { items, total, skip, take }
	},

	async getById(id: string) {
		return prisma.customer.findUnique({
			where: { id },
			include: { orders: { orderBy: { createdAt: "desc" } } },
		})
	},
}