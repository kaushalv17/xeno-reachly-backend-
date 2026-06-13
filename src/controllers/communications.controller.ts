import { Request, Response } from "express"
import { asyncHandler } from "../utils/asyncHandler"
import { communicationService } from "../services/communication.service"
import { ApiError } from "../utils/ApiError"

export const communicationsController = {
list: asyncHandler(async (req: Request, res: Response) => {
const campaignId = req.query.campaignId as string | undefined
if (!campaignId) throw ApiError.badRequest("campaignId query param is required")
res.json(await communicationService.listByCampaign(campaignId))
}),

breakdown: asyncHandler(async (req: Request, res: Response) => {
const campaignId = req.query.campaignId as string | undefined
if (!campaignId) throw ApiError.badRequest("campaignId query param is required")
res.json(await communicationService.statusBreakdown(campaignId))
}),
}
