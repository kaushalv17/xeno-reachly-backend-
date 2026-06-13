import { z } from "zod"

export const aiSegmentInput = z.object({
	description: z.string().min(3).max(500),
})