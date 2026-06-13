import { randomUUID } from "crypto"
import { SendRequest, SimulatedPlan, ReceiptCallback } from "../types"
import { sendCallback } from "./callbackSender"
import { sleep } from "../utils/jitter"
import { logger } from "../utils/logger"

// Plays out the staged lifecycle, firing an ordered callback after each transition.
export async function runLifecycle(
	req: SendRequest,
	plan: SimulatedPlan,
): Promise<void> {
	logger.info(
		{
			communicationId: req.communicationId,
			channel: req.channel,
			terminal: plan.terminalStatus,
			path: plan.stages.map((s) => s.status).join(" → "),
		},
		"Starting simulated delivery lifecycle",
	)

	for (const stage of plan.stages) {
		await sleep(stage.delayMs)

		const payload: ReceiptCallback = {
			communicationId: req.communicationId,
			idempotencyKey: req.idempotencyKey,
			providerMessageId: plan.providerMessageId,
			status: stage.status,
			eventId: `evt_${randomUUID()}`,
			occurredAt: new Date().toISOString(),
			...(stage.failureReason ? { failureReason: stage.failureReason } : {}),
		}

		await sendCallback(req.callbackUrl, payload)
	}

	logger.info(
		{ communicationId: req.communicationId, terminal: plan.terminalStatus },
		"Lifecycle complete",
	)
}