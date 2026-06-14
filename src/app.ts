import express from "express"
import cors from "cors"
import { notFoundHandler, errorHandler } from "./middleware/error.middleware"
import apiRouter from "./routes/index.routes"

export function createApp() {
	const app = express()

	// Core middleware
	app.use(cors())
	app.use(express.json({ limit: "5mb" }))

	// Health check
	app.get("/health", (_req, res) => {
		res.json({
			status: "ok",
			service: "reachly-crm",
			time: new Date().toISOString(),
		})
	})

	// API routes
	app.use("/api", apiRouter)

	app.use(notFoundHandler)
	app.use(errorHandler)

	return app
}