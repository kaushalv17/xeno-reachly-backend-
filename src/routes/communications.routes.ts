import { Router } from "express"
import { communicationsController } from "../controllers/communications.controller"

const router = Router()

router.get("/", communicationsController.list)
router.get("/breakdown", communicationsController.breakdown)

export default router
