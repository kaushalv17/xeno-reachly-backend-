import { Prisma, EventType } from "@prisma/client"
import { prisma } from "../config/db"
import { logger } from "../utils/logger"

export type DeliveryStatus =
    | "QUEUED" | "SENT" | "DELIVERED" | "READ" | "CLICKED" | "CONVERTED" | "FAILED"

// Monotonic ranks enforce forward-only progression.
const STATUS_RANK: Record<DeliveryStatus, number> = {
    QUEUED: 0, SENT: 1, DELIVERED: 2, READ: 3, CLICKED: 4, CONVERTED: 5, FAILED: 6,
}

const TERMINAL: DeliveryStatus[] = ["CONVERTED", "FAILED"]

// Which timestamp column to stamp when we first reach a status.
const STAGE_TIMESTAMP: Partial<Record<DeliveryStatus, string>> = {
    SENT: "sentAt",
    DELIVERED: "deliveredAt",
    READ: "readAt",
    CLICKED: "clickedAt",
    CONVERTED: "convertedAt",
    FAILED: "failedAt",
}

interface ReceiptInput {
    communicationId: string
    idempotencyKey: string
    providerMessageId: string
    status: DeliveryStatus
    eventId: string
    occurredAt: string
    failureReason?: string
}

export const deliveryService = {
    async handleReceipt(input: ReceiptInput) {
        return prisma.$transaction(
            async (tx) => {
                const comm = await tx.communication.findUnique({
                    where: { id: input.communicationId },
                })
                if (!comm) {
                    logger.warn({ communicationId: input.communicationId }, "Receipt for unknown communication")
                    return { applied: false, reason: "unknown_communication" }
                }

                // 1) Idempotency — already processed this exact provider event?
                const seen = await tx.communicationEvent.findUnique({
                    where: { eventId: input.eventId },
                })
                if (seen) {
                    return { applied: false, reason: "duplicate_event", status: comm.status }
                }

                // 2) Append to the immutable event log (always, even if we don't advance).
                await tx.communicationEvent.create({
                    data: {
                        communicationId: comm.id,
                        eventId: input.eventId,
                        type: input.status as EventType,
                        payload: {
                            providerMessageId: input.providerMessageId,
                            occurredAt: input.occurredAt,
                            failureReason: input.failureReason ?? null,
                        } as Prisma.InputJsonValue,
                        occurredAt: new Date(input.occurredAt),
                    },
                })

                const current = comm.status as DeliveryStatus
                const incoming = input.status

                // 3) Forward-only guard.
                const isTerminal = TERMINAL.includes(current)
                const isForward = STATUS_RANK[incoming] > comm.statusRank
                if (isTerminal || !isForward) {
                    logger.info(
                        { communicationId: comm.id, current, incoming },
                        "Receipt logged; state not advanced (terminal or out-of-order)",
                    )
                    return { applied: false, reason: "no_advance", status: current }
                }

                // 4) Advance status, stamp the stage timestamp, capture failure reason.
                const data: Record<string, unknown> = {
                    status: incoming,
                    statusRank: STATUS_RANK[incoming],
                }
                const tsField = STAGE_TIMESTAMP[incoming]
                if (tsField) data[tsField] = new Date(input.occurredAt)
                if (incoming === "FAILED" && input.failureReason) {
                    data.failureReason = input.failureReason
                }

                await tx.communication.update({ where: { id: comm.id }, data })

                logger.info({ communicationId: comm.id, from: current, to: incoming }, "Communication advanced")
                return { applied: true, status: incoming }
            },
            { maxWait: 15000, timeout: 30000 },
        )
    },
}
