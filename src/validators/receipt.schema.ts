import { z } from "zod"

export const receiptSchema = z.object({
    communicationId: z.string().min(1),
    idempotencyKey: z.string().min(1),
    providerMessageId: z.string().min(1),
    status: z.enum(["QUEUED", "SENT", "DELIVERED", "READ", "CLICKED", "CONVERTED", "FAILED"]),
    eventId: z.string().min(1),
    occurredAt: z.string().min(1),
    failureReason: z.string().optional(),
})

export type ReceiptBody = z.infer<typeof receiptSchema>
