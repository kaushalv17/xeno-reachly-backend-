import { Router } from "express"
import { segmentsController } from "../controllers/segments.controller"
import { validate } from "../middleware/validate.middleware"
import { previewInput, createSegmentInput } from "../validators/segment.schema"

const router = Router()
router.post("/preview", validate(previewInput), segmentsController.preview)
router.post("/", validate(createSegmentInput), segmentsController.create)
router.get("/", segmentsController.list)
export default router