import { Request, Response } from "express"
import { asyncHandler } from "../utils/asyncHandler"
import { segmentService } from "../services/segment.service"

export const segmentsController = {
	preview: asyncHandler(async (req: Request, res: Response) => {
		const { rule, sampleSize } = req.body
		res.json(await segmentService.preview(rule, sampleSize ?? 10))
	}),

	create: asyncHandler(async (req: Request, res: Response) => {
		res.status(201).json(await segmentService.create(req.body))
	}),

	list: asyncHandler(async (_req: Request, res: Response) => {
		res.json({ items: await segmentService.list() })
	}),
}