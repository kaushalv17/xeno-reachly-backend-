import { asyncHandler } from "../utils/asyncHandler"
import { analyticsService } from "../services/analytics.service"

export const analyticsController = {
    overview: asyncHandler(async (_req, res) => {
        const data = await analyticsService.overview()
        res.json(data)
    }),
    insights: asyncHandler(async (req, res) => {
        const campaignId =
            typeof req.query.campaignId === "string" ? req.query.campaignId : undefined
        const data = await analyticsService.insights(campaignId)
        res.json(data)
    }),
    campaign: asyncHandler(async (req, res) => {
        const data = await analyticsService.forCampaign(req.params.id)
        res.json(data)
    }),
}
