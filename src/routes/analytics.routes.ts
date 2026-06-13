import { Router } from "express"
import { analyticsController } from "../controllers/analytics.controller"

const router = Router()

router.get("/overview", analyticsController.overview)
router.get("/insights", analyticsController.insights)
router.get("/campaigns/:id", analyticsController.campaign)

export default router
