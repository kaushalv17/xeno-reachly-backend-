import { Router } from "express"
import { agentController } from "../controllers/agent.controller"
import { validate } from "../middleware/validate.middleware"
import { draftSchema } from "../validators/draft.schema"
import { agentRunSchema } from "../validators/agent.schema"

const router = Router()

router.post("/draft", validate(draftSchema), agentController.draft)
router.post("/run", validate(agentRunSchema), agentController.run)

export default router
