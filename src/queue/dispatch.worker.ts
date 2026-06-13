import { Worker, Job } from "bullmq"
import { createRedisConnection } from "../config/redis"
import { DISPATCH_QUEUE, DispatchJobData } from "./queue"
import { prisma } from "../config/db"
import { logger } from "../utils/logger"

const CHANNEL_SERVICE_URL = process.env.CHANNEL_SERVICE_URL ?? "http://localhost:4100"
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL ?? "http://localhost:4000"

async function processDispatch(job: Job<DispatchJobData>) {
	const { communicationId } = job.data
	const comm = await prisma.communication.findUnique({ where: { id: communicationId } })
	if (!comm) {
		logger.warn({ communicationId }, "Communication not found, skipping")
		return
	}
	// Idempotent worker: only dispatch things still QUEUED.
	if (comm.status !== "QUEUED") {
		logger.info({ communicationId, status: comm.status }, "Already dispatched, skipping")
		return
	}

	const res = await fetch(`${CHANNEL_SERVICE_URL}/send`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			communicationId: comm.id,
			idempotencyKey: comm.idempotencyKey,
			channel: comm.channel,
			recipient: comm.recipient,
			message: comm.renderedMessage,
			callbackUrl: `${PUBLIC_BASE_URL}/api/receipts`,
		}),
	})

	if (!res.ok) {
		// Throwing makes BullMQ retry with exponential backoff.
		throw new Error(`Channel service responded ${res.status}`)
	}

	const data = (await res.json()) as { providerMessageId?: string }

	await prisma.communication.update({
		where: { id: comm.id },
		data: { status: "SENT", statusRank: 1, attempts: { increment: 1 } },
	})

	logger.info(
		{ communicationId: comm.id, providerMessageId: data.providerMessageId },
		"Dispatched to channel service",
	)
}

const worker = new Worker<DispatchJobData>(DISPATCH_QUEUE, processDispatch, {
	connection: createRedisConnection(),
	concurrency: 10,
})

worker.on("failed", (job, err) => {
	logger.error({ jobId: job?.id, err: err.message }, "Dispatch job failed")
})

logger.info("Dispatch worker started — listening on the 'dispatch' queue")