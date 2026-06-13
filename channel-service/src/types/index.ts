export type Channel = "WHATSAPP" | "SMS" | "EMAIL" | "RCS"

export type DeliveryStatus =
	| "SENT"
	| "DELIVERED"
	| "READ"
	| "CLICKED"
	| "CONVERTED"
	| "FAILED"

// What the CRM sends us to dispatch a single message
export interface SendRequest {
	communicationId: string
	idempotencyKey: string
	channel: Channel
	recipient: string
	message: string
	callbackUrl: string // CRM receipt endpoint we call back into
}

// What we POST back to the CRM on every status change
export interface ReceiptCallback {
	communicationId: string
	idempotencyKey: string
	providerMessageId: string
	status: DeliveryStatus
	eventId: string
	occurredAt: string // ISO timestamp
	failureReason?: string
}

// The pre-computed outcome the simulator decides for one message
export interface SimulatedPlan {
	providerMessageId: string
	terminalStatus: DeliveryStatus
	stages: Array<{
		status: DeliveryStatus
		delayMs: number
		failureReason?: string
	}>
}