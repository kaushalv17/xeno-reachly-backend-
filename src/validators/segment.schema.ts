import { z } from "zod"
import { ruleGroupSchema } from "../rules/ruleSchema"

export const previewInput = z.object({
	rule: ruleGroupSchema,
	sampleSize: z.number().int().min(0).max(100).optional(),
})

export const createSegmentInput = z.object({
	name: z.string().min(1),
	description: z.string().optional(),
	rule: ruleGroupSchema,
	source: z.enum(["AI", "HUMAN"]).optional(),
})