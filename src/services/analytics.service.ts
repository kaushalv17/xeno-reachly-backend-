import { prisma } from "../config/db"
import { ApiError } from "../utils/ApiError"
import { logger } from "../utils/logger"
import { generateText } from "./ai/ai.client"
import {
    insightsSystemPrompt,
    buildInsightsUserPrompt,
    buildFallbackInsights,
    type FunnelCounts,
    type Rates,
} from "./ai/insights.prompt"
import type { Prisma } from "@prisma/client"

// Cumulative funnel: each stage counts everyone who reached AT LEAST that stage.
// FAILED is tracked separately (it is terminal but not "progress").
async function computeFunnel(
    where: Prisma.CommunicationWhereInput,
): Promise<FunnelCounts> {
    const countIn = (statuses: string[]) =>
        prisma.communication.count({
            where: { ...where, status: { in: statuses as any } },
        })

    const [total, queued, sent, delivered, read, clicked, converted, failed] =
        await Promise.all([
            prisma.communication.count({ where }),
            countIn(["QUEUED"]),
            countIn(["SENT", "DELIVERED", "READ", "CLICKED", "CONVERTED"]),
            countIn(["DELIVERED", "READ", "CLICKED", "CONVERTED"]),
            countIn(["READ", "CLICKED", "CONVERTED"]),
            countIn(["CLICKED", "CONVERTED"]),
            countIn(["CONVERTED"]),
            countIn(["FAILED"]),
        ])

    return { total, queued, sent, delivered, read, clicked, converted, failed }
}

function pct(n: number, d: number): number {
    if (!d) return 0
    return Math.round((n / d) * 1000) / 10
}

function computeRates(f: FunnelCounts): Rates {
    return {
        deliveryRate: pct(f.delivered, f.total),
        readRate: pct(f.read, f.delivered),
        clickRate: pct(f.clicked, f.read),
        conversionRate: pct(f.converted, f.total),
        failureRate: pct(f.failed, f.total),
    }
}

export const analyticsService = {
    async overview() {
        const funnel = await computeFunnel({})
        const rates = computeRates(funnel)
        const [campaigns, customers] = await Promise.all([
            prisma.campaign.count(),
            prisma.customer.count(),
        ])
        return { scope: "workspace", campaigns, customers, funnel, rates }
    },

    async forCampaign(campaignId: string) {
        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
        })
        if (!campaign) throw ApiError.notFound("Campaign not found")
        const funnel = await computeFunnel({ campaignId })
        const rates = computeRates(funnel)
        return {
            scope: "campaign",
            campaign: {
                id: campaign.id,
                name: campaign.name,
                status: campaign.status,
                channel: campaign.channel,
            },
            funnel,
            rates,
        }
    },

    async insights(campaignId?: string) {
        const base = campaignId
            ? await this.forCampaign(campaignId)
            : await this.overview()
        const { funnel, rates } = base

        let summary: string
        let source: "gemini" | "fallback" = "gemini"
        try {
            summary = await generateText({
                system: insightsSystemPrompt,
                user: buildInsightsUserPrompt(funnel, rates, base.scope),
            })
            if (!summary || !summary.trim()) {
                throw new Error("Gemini returned an empty insight")
            }
        } catch (err) {
            logger.warn(
                { err: (err as Error).message },
                "Gemini insights unavailable - using deterministic summary",
            )
            summary = buildFallbackInsights(funnel, rates)
            source = "fallback"
        }

        return { ...base, insights: { source, summary } }
    },
}
