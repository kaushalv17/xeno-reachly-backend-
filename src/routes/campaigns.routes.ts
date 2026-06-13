import { Router } from "express"
import { campaignsController } from "../controllers/campaigns.controller"
import { validate } from "../middleware/validate.middleware"
import { createCampaignSchema } from "../validators/campaign.schema"

const router = Router()

router.post("/", validate(createCampaignSchema), campaignsController.create)
router.get("/", campaignsController.list)
router.get("/:id", campaignsController.get)
router.post("/:id/launch", campaignsController.launch)

export default router