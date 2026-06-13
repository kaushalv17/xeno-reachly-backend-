import { describe, it, expect } from "vitest"
import { ruleToWhere } from "../src/rules/ruleToPrisma"

describe("ruleToWhere", () => {
	it("translates a numeric gte condition", () => {
		const where = ruleToWhere({
			combinator: "and",
			conditions: [{ field: "totalSpend", operator: "gte", value: 10000 }],
		})
		expect(where).toEqual({ AND: [{ totalSpend: { gte: 10000 } }] })
	})

	it("translates tags contains to Prisma has", () => {
		const where = ruleToWhere({
			combinator: "and",
			conditions: [{ field: "tags", operator: "contains", value: "vip" }],
		})
		expect(where).toEqual({ AND: [{ tags: { has: "vip" } }] })
	})

	it("translates inactiveDays >= N to an OR including never-ordered", () => {
		const where = ruleToWhere({
			combinator: "or",
			conditions: [{ field: "inactiveDays", operator: "gte", value: 90 }],
		}) as { OR: Array<{ OR?: unknown[] }> }
		expect(where.OR[0].OR).toBeDefined()
		expect(where.OR[0].OR).toHaveLength(2)
	})

	it("handles nested AND/OR groups", () => {
		const where = ruleToWhere({
			combinator: "and",
			conditions: [
				{ field: "city", operator: "in", value: ["Mumbai", "Delhi"] },
				{
					combinator: "or",
					conditions: [
						{ field: "totalSpend", operator: "gte", value: 5000 },
						{ field: "tags", operator: "contains", value: "vip" },
					],
				},
			],
		}) as { AND: Array<{ OR?: unknown[] }> }
		expect(where.AND).toHaveLength(2)
		expect(where.AND[1].OR).toHaveLength(2)
	})
})