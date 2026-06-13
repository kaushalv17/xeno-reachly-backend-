import type { Prisma } from "@prisma/client"
import { Condition, RuleGroup } from "./ruleSchema"

function isGroup(node: Condition | RuleGroup): node is RuleGroup {
	return (node as RuleGroup).combinator !== undefined
}

function conditionToWhere(c: Condition): Prisma.CustomerWhereInput {
	const { field, operator, value } = c

	// Derived recency: inactiveDays >= N  →  last order older than N days (or never ordered)
	if (field === "inactiveDays") {
		const cutoff = new Date()
		cutoff.setDate(cutoff.getDate() - Number(value))
		if (operator === "gte" || operator === "gt") {
			return { OR: [{ lastOrderAt: { lt: cutoff } }, { lastOrderAt: null }] }
		}
		if (operator === "lte" || operator === "lt") {
			return { lastOrderAt: { gte: cutoff } }
		}
		throw new Error(`inactiveDays supports gt/gte/lt/lte, got ${operator}`)
	}

	// Array field: tags
	if (field === "tags") {
		if (operator === "contains") return { tags: { has: String(value) } }
		if (operator === "in") return { tags: { hasSome: (value as unknown[]).map(String) } }
		throw new Error(`tags supports contains/in, got ${operator}`)
	}

	// String fields
	if (["city", "country", "name", "email"].includes(field)) {
		switch (operator) {
			case "eq":
				return { [field]: { equals: String(value) } } as Prisma.CustomerWhereInput
			case "neq":
				return { [field]: { not: String(value) } } as Prisma.CustomerWhereInput
			case "contains":
				return { [field]: { contains: String(value), mode: "insensitive" } } as Prisma.CustomerWhereInput
			case "in":
				return { [field]: { in: (value as unknown[]).map(String) } } as Prisma.CustomerWhereInput
			default:
				throw new Error(`${field} supports eq/neq/contains/in, got ${operator}`)
		}
	}

	// Numeric fields
	if (field === "totalSpend" || field === "orderCount") {
		const num = Number(value)
		switch (operator) {
			case "eq":
				return { [field]: { equals: num } } as Prisma.CustomerWhereInput
			case "neq":
				return { [field]: { not: num } } as Prisma.CustomerWhereInput
			case "gt":
				return { [field]: { gt: num } } as Prisma.CustomerWhereInput
			case "gte":
				return { [field]: { gte: num } } as Prisma.CustomerWhereInput
			case "lt":
				return { [field]: { lt: num } } as Prisma.CustomerWhereInput
			case "lte":
				return { [field]: { lte: num } } as Prisma.CustomerWhereInput
			default:
				throw new Error(`${field} supports numeric operators, got ${operator}`)
		}
	}

	// Direct date on lastOrderAt
	if (field === "lastOrderAt") {
		const date = new Date(String(value))
		switch (operator) {
			case "gt":
				return { lastOrderAt: { gt: date } }
			case "gte":
				return { lastOrderAt: { gte: date } }
			case "lt":
				return { lastOrderAt: { lt: date } }
			case "lte":
				return { lastOrderAt: { lte: date } }
			default:
				throw new Error(`lastOrderAt supports gt/gte/lt/lte, got ${operator}`)
		}
	}

	throw new Error(`Unsupported field: ${field}`)
}

export function ruleToWhere(node: Condition | RuleGroup): Prisma.CustomerWhereInput {
	if (isGroup(node)) {
		const clauses = node.conditions.map(ruleToWhere)
		return node.combinator === "and" ? { AND: clauses } : { OR: clauses }
	}
	return conditionToWhere(node)
}