import { z } from "zod"

export const agentRunSchema = z.object({
    goal: z.string().min(3),
    channel: z.enum(["WHATSAPP", "SMS", "EMAIL", "RCS"]).optional(),
    autoLaunch: z.boolean().optional(),
    campaignName: z.string().optional(),
})

export type AgentRunBody = z.infer<typeof agentRunSchema>
