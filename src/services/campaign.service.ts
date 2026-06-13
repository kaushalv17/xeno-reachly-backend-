import { Prisma, Channel } from "@prisma/client"
import { prisma } from "../config/db"
import { RuleGroup } from "../rules/ruleSchema"
import { ruleToWhere } from "../rules/ruleToPrisma"
import { personalize } from "../utils/personalize"
import { dispatchQueue } from "../queue/queue"
import { ApiError } from "../utils/ApiError"
import { logger } from "../utils/logger"

interface CreateCampaignInput {
	name: string
	goal?: string
	channel: Channel
	messageTemplate: string
	rule: RuleGroup
	segmentName?: string
}

export const campaignService = {
	// Create a DRAFT campaign backed by a saved segment.
	async create(input: CreateCampaignInput) {
		const where = ruleToWhere(input.rule)
		const audienceSize = await prisma.customer.count({ where })

		const segment = await prisma.segment.create({
			data: {
				name: input.segmentName ?? `${input.name} — audience`,
				ruleJson: input.rule as unknown as Prisma.InputJsonValue,
				source: "HUMAN",
			},
		})

		const campaign = await prisma.campaign.create({
			data: {
				name: input.name,
				goal: input.goal,
				channel: input.channel,
				messageTemplate: input.messageTemplate,
				segmentId: segment.id,
				audienceSize,
				status: "DRAFT",
			},
		})

		return { campaign, segment, audienceSize }
	},

	// Resolve the audience, create QUEUED communications, and enqueue dispatch jobs.
	async launch(campaignId: string) {
		const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } })
		if (!campaign) throw ApiError.notFound("Campaign not found")
		if (!campaign.segmentId) throw ApiError.badRequest("Campaign has no segment")
		if (campaign.status === "RUNNING") {
			throw ApiError.badRequest("Campaign is already running")
		}

		const segment = await prisma.segment.findUnique({
			where: { id: campaign.segmentId },
		})
		if (!segment) throw ApiError.badRequest("Segment not found for campaign")

		const rule = segment.ruleJson as unknown as RuleGroup
		const audience = await prisma.customer.findMany({ where: ruleToWhere(rule) })

		let queued = 0
		for (const customer of audience) {
			const recipient =
				campaign.channel === "EMAIL"
					? customer.email
					: customer.phone ?? customer.email
			if (!recipient) continue

			const renderedMessage = personalize(campaign.messageTemplate, {
				name: customer.name,
				city: customer.city,
				email: customer.email,
				totalSpend: customer.totalSpend,
				orderCount: customer.orderCount,
			})

			// Deterministic key → re-launching never double-sends.
			const idempotencyKey = `${campaign.id}:${customer.id}`

			const comm = await prisma.communication.upsert({
				where: { idempotencyKey },
				create: {
					campaignId: campaign.id,
					customerId: customer.id,
					channel: campaign.channel,
					recipient,
					renderedMessage,
					status: "QUEUED",
					idempotencyKey,
				},
				update: {}, // leave any existing communication untouched
			})

			// jobId = comm.id dedupes at the queue level too.
			await dispatchQueue.add("dispatch", { communicationId: comm.id }, { jobId: comm.id })
			queued++
		}

		const updated = await prisma.campaign.update({
			where: { id: campaign.id },
			data: { status: "RUNNING", launchedAt: new Date() },
		})

		logger.info({ campaignId: campaign.id, queued }, "Campaign launched")
		return { campaign: updated, queued }
	},

	async list() {
		return prisma.campaign.findMany({ orderBy: { id: "desc" } })
	},

	async get(id: string) {
		const campaign = await prisma.campaign.findUnique({ where: { id } })
		if (!campaign) throw ApiError.notFound("Campaign not found")
		return campaign
	},
}