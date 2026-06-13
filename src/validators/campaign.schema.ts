import { z } from "zod"
import { ruleGroupSchema } from "../rules/ruleSchema"

export const createCampaignSchema = z.object({
	name: z.string().min(2).max(120),
	goal: z.string().max(500).optional(),
	channel: z.enum(["WHATSAPP", "SMS", "EMAIL", "RCS"]),
	messageTemplate: z.string().min(2).max(2000),
	rule: ruleGroupSchema,
	segmentName: z.string().max(120).optional(),
})

export type CreateCampaignBody = z.infer<typeof createCampaignSchema>