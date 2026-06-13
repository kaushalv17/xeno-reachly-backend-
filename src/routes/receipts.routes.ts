import { Router } from "express"
import { receiptsController } from "../controllers/receipts.controller"
import { validate } from "../middleware/validate.middleware"
import { receiptSchema } from "../validators/receipt.schema"

const router = Router()

router.post("/", validate(receiptSchema), receiptsController.handle)

export default router
