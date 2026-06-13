import { randomUUID } from "crypto"
import { Channel, SimulatedPlan } from "../types"
import { chance, jitter } from "../utils/jitter"

// Each channel behaves differently in the real world
const CHANNEL_PROFILE: Record<Channel, { deliverRate: number; baseDelayMs: number }> = {
	WHATSAPP: { deliverRate: 0.92, baseDelayMs: 800 },
	SMS: { deliverRate: 0.88, baseDelayMs: 1200 },
	EMAIL: { deliverRate: 0.97, baseDelayMs: 1500 },
	RCS: { deliverRate: 0.85, baseDelayMs: 1000 },
}

const FAILURE_REASONS = [
	"INVALID_NUMBER",
	"USER_OPTED_OUT",
	"DEVICE_UNREACHABLE",
	"PROVIDER_TIMEOUT",
	"SPAM_BLOCKED",
]

// Conversion funnel — each probability is conditional on the previous stage
const P_READ_GIVEN_DELIVERED = 0.7
const P_CLICK_GIVEN_READ = 0.45
const P_CONVERT_GIVEN_CLICK = 0.3

export function simulateOutcome(channel: Channel): SimulatedPlan {
	const profile = CHANNEL_PROFILE[channel] ?? CHANNEL_PROFILE.EMAIL
	const providerMessageId = `pm_${randomUUID()}`
	const stages: SimulatedPlan["stages"] = []

	// 1) SENT — we always accept and attempt
	stages.push({ status: "SENT", delayMs: jitter(300, 200) })

	// 2) DELIVERED or FAILED (terminal)
	if (!chance(profile.deliverRate)) {
		const failureReason =
			FAILURE_REASONS[Math.floor(Math.random() * FAILURE_REASONS.length)]
		stages.push({
			status: "FAILED",
			delayMs: jitter(profile.baseDelayMs, 400),
			failureReason,
		})
		return { providerMessageId, terminalStatus: "FAILED", stages }
	}
	stages.push({ status: "DELIVERED", delayMs: jitter(profile.baseDelayMs, 500) })

	// 3) READ → 4) CLICKED → 5) CONVERTED (each gated by funnel probability)
	if (chance(P_READ_GIVEN_DELIVERED)) {
		stages.push({ status: "READ", delayMs: jitter(4000, 2500) })
		if (chance(P_CLICK_GIVEN_READ)) {
			stages.push({ status: "CLICKED", delayMs: jitter(3000, 2000) })
			if (chance(P_CONVERT_GIVEN_CLICK)) {
				stages.push({ status: "CONVERTED", delayMs: jitter(6000, 4000) })
			}
		}
	}

	const terminalStatus = stages[stages.length - 1].status
	return { providerMessageId, terminalStatus, stages }
}