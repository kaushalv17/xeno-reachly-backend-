import { Request, Response } from "express"
import { asyncHandler } from "../utils/asyncHandler"
import { draftService } from "../services/ai/draft.service"
import { agentService } from "../services/ai/agent"

export const agentController = {
    draft: asyncHandler(async (req: Request, res: Response) => {
        const result = await draftService.draftMessages(req.body)
        res.json(result)
    }),

    run: asyncHandler(async (req: Request, res: Response) => {
        const result = await agentService.run(req.body)
        res.json(result)
    }),
}
