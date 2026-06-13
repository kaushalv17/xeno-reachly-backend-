import { Router } from "express"
import { ordersController } from "../controllers/orders.controller"
import { validate } from "../middleware/validate.middleware"
import { orderBulkInput } from "../validators/order.schema"

const router = Router()
router.post("/", validate(orderBulkInput), ordersController.create)
router.get("/", ordersController.list)
export default router