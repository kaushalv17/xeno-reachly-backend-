import { Request, Response } from "express"
import { asyncHandler } from "../utils/asyncHandler"
import { aiSegmentService } from "../services/ai/segment.ai.service"

export const aiController = {
	segment: asyncHandler(async (req: Request, res: Response) => {
		const { description } = req.body
		res.json(await aiSegmentService.fromNaturalLanguage(description))
	}),
}