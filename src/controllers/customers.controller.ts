import { Request, Response } from "express"
import { asyncHandler } from "../utils/asyncHandler"
import { customerService } from "../services/customer.service"

const toArray = <T>(body: T | T[]): T[] => (Array.isArray(body) ? body : [body])

export const customersController = {
	create: asyncHandler(async (req: Request, res: Response) => {
		const customers = await customerService.upsertMany(toArray(req.body))
		res.status(201).json({ count: customers.length, customers })
	}),

	list: asyncHandler(async (req: Request, res: Response) => {
		const skip = Number(req.query.skip ?? 0)
		const take = Math.min(Number(req.query.take ?? 50), 200)
		res.json(await customerService.list({ skip, take }))
	}),

	get: asyncHandler(async (req: Request, res: Response) => {
		const customer = await customerService.getById(req.params.id)
		if (!customer) return res.status(404).json({ error: "Customer not found" })
		res.json(customer)
	}),
}