import { Router } from "express"
import { asyncHandler } from "../utils/asyncHandler"
import { validate } from "../middleware/validate.middleware"
import { ingestInput } from "../validators/ingestion.schema"
import { ingestionService } from "../services/ingestion.service"

const router = Router()
router.post(
	"/",
	validate(ingestInput),
	asyncHandler(async (req, res) => {
		res.status(201).json(await ingestionService.ingest(req.body))
	}),
)
export default router