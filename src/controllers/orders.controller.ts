import { Request, Response } from "express"
import { asyncHandler } from "../utils/asyncHandler"
import { orderService } from "../services/order.service"

const toArray = <T>(body: T | T[]): T[] => (Array.isArray(body) ? body : [body])

export const ordersController = {
	create: asyncHandler(async (req: Request, res: Response) => {
		const orders = await orderService.createMany(toArray(req.body))
		res.status(201).json({ count: orders.length, orders })
	}),

	list: asyncHandler(async (req: Request, res: Response) => {
		const skip = Number(req.query.skip ?? 0)
		const take = Math.min(Number(req.query.take ?? 50), 200)
		res.json(await orderService.list({ skip, take }))
	}),
}