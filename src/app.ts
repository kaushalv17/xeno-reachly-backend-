import express from "express"
import { notFoundHandler, errorHandler } from "./middleware/error.middleware"
import apiRouter from "./routes/index.routes" // ← NEW

export function createApp() {
	const app = express()

	// Core middleware
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
	app.use("/api", apiRouter) // ← NEW (mount all /api/* routes)

	app.use(notFoundHandler)
	app.use(errorHandler)

	return app
}