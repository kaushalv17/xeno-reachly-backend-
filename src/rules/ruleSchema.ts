import { z } from "zod"

export const FIELDS = [
	"totalSpend",
	"orderCount",
	"lastOrderAt",
	"inactiveDays", // derived from lastOrderAt (days since last order)
	"city",
	"country",
	"tags",
	"name",
	"email",
] as const

export const OPERATORS = ["eq", "neq", "gt", "gte", "lt", "lte", "contains", "in"] as const

export const conditionSchema = z.object({
	field: z.enum(FIELDS),
	operator: z.enum(OPERATORS),
	value: z.union([
		z.string(),
		z.number(),
		z.boolean(),
		z.array(z.union([z.string(), z.number()])),
	]),
})

export type Condition = z.infer<typeof conditionSchema>

export type RuleGroup = {
	combinator: "and" | "or"
	conditions: Array<Condition | RuleGroup>
}

// Recursive schema (groups can nest groups)
export const ruleGroupSchema: z.ZodType<RuleGroup> = z.lazy(() =>
	z.object({
		combinator: z.enum(["and", "or"]),
		conditions: z.array(z.union([conditionSchema, ruleGroupSchema])).min(1),
	}),
)