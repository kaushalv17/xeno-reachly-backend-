import { ReceiptCallback } from "../types"
import { logger } from "../utils/logger"
import { sleep, jitter } from "../utils/jitter"

const MAX_ATTEMPTS = 5
const BASE_BACKOFF_MS = 500

// POST a single receipt to the CRM, retrying with exponential backoff if it fails.
export async function sendCallback(
	callbackUrl: string,
	payload: ReceiptCallback,
): Promise<boolean> {
	for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
		try {
			const res = await fetch(callbackUrl, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			})
			if (res.ok) {
				logger.info(
					{ communicationId: payload.communicationId, status: payload.status, attempt },
					"Receipt callback delivered",
				)
				return true
			}
			logger.warn(
				{
					communicationId: payload.communicationId,
					status: payload.status,
					httpStatus: res.status,
					attempt,
				},
				"Receipt callback non-2xx, will retry",
			)
		} catch (err) {
			logger.warn(
				{
					communicationId: payload.communicationId,
					status: payload.status,
					attempt,
					err: (err as Error).message,
				},
				"Receipt callback request failed, will retry",
			)
		}

		if (attempt < MAX_ATTEMPTS) {
			// exponential backoff: 0.5s, 1s, 2s, 4s (+jitter)
			const backoff = jitter(BASE_BACKOFF_MS * 2 ** (attempt - 1), 200)
			await sleep(backoff)
		}
	}

	logger.error(
		{ communicationId: payload.communicationId, status: payload.status },
		"Receipt callback permanently failed after max attempts",
	)
	return false
}