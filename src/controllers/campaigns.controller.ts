import { Request, Response } from "express"
import { asyncHandler } from "../utils/asyncHandler"
import { campaignService } from "../services/campaign.service"

export const campaignsController = {
	create: asyncHandler(async (req: Request, res: Response) => {
		const result = await campaignService.create(req.body)
		res.status(201).json(result)
	}),

	launch: asyncHandler(async (req: Request, res: Response) => {
		const result = await campaignService.launch(req.params.id)
		res.json(result)
	}),

	list: asyncHandler(async (_req: Request, res: Response) => {
		res.json(await campaignService.list())
	}),

	get: asyncHandler(async (req: Request, res: Response) => {
		res.json(await campaignService.get(req.params.id))
	}),
}