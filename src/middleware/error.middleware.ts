import { Request, Response, NextFunction } from "express"
import { ApiError } from "../utils/ApiError"
import { logger } from "../utils/logger"

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Route not found" })
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: err.message, details: err.details })
  }
  logger.error(err)
  return res.status(500).json({ error: "Internal server error" })
}