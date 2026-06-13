import { Request, Response, NextFunction } from "express"
import { ZodSchema } from "zod"
import { ApiError } from "../utils/ApiError"

export const validate =
	(schema: ZodSchema) =>
	(req: Request, _res: Response, next: NextFunction) => {
		const result = schema.safeParse(req.body)
		if (!result.success) {
			return next(ApiError.badRequest("Validation failed", result.error.flatten()))
		}
		req.body = result.data
		next()
	}