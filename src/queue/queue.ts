import { Queue } from "bullmq"
import { redisConnection } from "../config/redis"

export const DISPATCH_QUEUE = "dispatch"

export interface DispatchJobData {
	communicationId: string
}

export const dispatchQueue = new Queue<DispatchJobData>(DISPATCH_QUEUE, {
	connection: redisConnection,
	defaultJobOptions: {
		attempts: 3,
		backoff: { type: "exponential", delay: 2000 },
		removeOnComplete: 1000,
		removeOnFail: 5000,
	},
})