import IORedis from "ioredis"

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6380"

// BullMQ requires maxRetriesPerRequest: null on its connections.
export function createRedisConnection() {
	return new IORedis(REDIS_URL, { maxRetriesPerRequest: null })
}

// Shared connection for the queue producer (the API side).
export const redisConnection = createRedisConnection()