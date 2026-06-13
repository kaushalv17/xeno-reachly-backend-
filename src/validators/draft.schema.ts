import { z } from "zod"

export const draftSchema = z.object({
    goal: z.string().min(3),
    channel: z.enum(["WHATSAPP", "SMS", "EMAIL", "RCS"]),
    audienceSummary: z.string().optional(),
    tone: z.string().optional(),
    count: z.number().int().min(1).max(5).optional(),
})

export type DraftBody = z.infer<typeof draftSchema>
