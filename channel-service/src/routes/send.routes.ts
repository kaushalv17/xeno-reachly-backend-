import { Router, Request, Response } from "express"
import { SendRequest } from "../types"
import { simulateOutcome } from "../simulator/outcomeSimulator"
import { runLifecycle } from "../simulator/lifecycle"
import { logger } from "../utils/logger"

const router = Router()

const REQUIRED_FIELDS = [
	"communicationId",
	"idempotencyKey",
	"channel",
	"recipient",
	"message",
	"callbackUrl",
] as const

router.post("/send", (req: Request, res: Response) => {
	const body = req.body as Partial<SendRequest>
	const missing = REQUIRED_FIELDS.filter((k) => !body[k])
	if (missing.length > 0) {
		return res
			.status(400)
			.json({ error: `Missing required fields: ${missing.join(", ")}` })
	}

	const sendReq = body as SendRequest
	const plan = simulateOutcome(sendReq.channel)

	// Respond immediately — real providers ACK, then deliver asynchronously.
	res.status(202).json({
		accepted: true,
		providerMessageId: plan.providerMessageId,
		communicationId: sendReq.communicationId,
	})

	// Fire the async lifecycle AFTER responding; never block the CRM.
	runLifecycle(sendReq, plan).catch((err) => {
		logger.error(
			{ communicationId: sendReq.communicationId, err: (err as Error).message },
			"Lifecycle crashed",
		)
	})
})

export default router