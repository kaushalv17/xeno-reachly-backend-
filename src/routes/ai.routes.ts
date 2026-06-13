import { Router } from "express"
import { aiController } from "../controllers/ai.controller"
import { validate } from "../middleware/validate.middleware"
import { aiSegmentInput } from "../validators/ai.schema"

const router = Router()
router.post("/segment", validate(aiSegmentInput), aiController.segment)

export default router