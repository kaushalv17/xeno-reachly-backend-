import { Request, Response } from "express"
import { asyncHandler } from "../utils/asyncHandler"
import { deliveryService } from "../services/delivery.service"

export const receiptsController = {
    handle: asyncHandler(async (req: Request, res: Response) => {
        const result = await deliveryService.handleReceipt(req.body)
        res.status(200).json(result) // always 200 so the provider callback succeeds
    }),
}
