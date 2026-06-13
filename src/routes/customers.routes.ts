import { Router } from "express"
import { customersController } from "../controllers/customers.controller"
import { validate } from "../middleware/validate.middleware"
import { customerBulkInput } from "../validators/customer.schema"

const router = Router()
router.post("/", validate(customerBulkInput), customersController.create)
router.get("/", customersController.list)
router.get("/:id", customersController.get)
export default router