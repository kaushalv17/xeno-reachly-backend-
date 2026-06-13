import { prisma } from "../config/db"
import { RuleGroup } from "../rules/ruleSchema"
import { ruleToWhere } from "../rules/ruleToPrisma"

export const segmentService = {
	async preview(rule: RuleGroup, sampleSize = 10) {
		const where = ruleToWhere(rule)
		const [audienceSize, sample] = await Promise.all([
			prisma.customer.count({ where }),
			sampleSize > 0
				? prisma.customer.findMany({
						where,
						take: sampleSize,
						orderBy: { totalSpend: "desc" },
						select: {
							id: true,
							name: true,
							email: true,
							city: true,
							totalSpend: true,
							orderCount: true,
							lastOrderAt: true,
							tags: true,
						},
				  })
				: Promise.resolve([]),
		])
		return { audienceSize, sample }
	},

	async create(input: {
		name: string
		description?: string
		rule: RuleGroup
		source?: "AI" | "HUMAN"
	}) {
		const audienceSize = await prisma.customer.count({ where: ruleToWhere(input.rule) })
		const segment = await prisma.segment.create({
			data: {
				name: input.name,
				description: input.description,
				ruleJson: input.rule as object,
				source: input.source ?? "HUMAN",
			},
		})
		return { segment, audienceSize }
	},

	async list() {
		return prisma.segment.findMany({ orderBy: { id: "desc" } })
	},
}