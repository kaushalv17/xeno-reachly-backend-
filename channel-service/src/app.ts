import express from "express"
import sendRoutes from "./routes/send.routes"
import { logger } from "./utils/logger"

export function createChannelApp() {
	const app = express()
	app.use(express.json({ limit: "2mb" }))

	app.get("/health", (_req, res) => {
		res.json({
			status: "ok",
			service: "reachly-channel-service",
			time: new Date().toISOString(),
		})
	})

	app.use("/", sendRoutes)

	app.use((_req, res) => {
		res.status(404).json({ error: "Route not found" })
	})

	app.use(
		(
			err: Error,
			_req: express.Request,
			res: express.Response,
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			_next: express.NextFunction,
		) => {
			logger.error({ err: err.message }, "Channel service error")
			res.status(500).json({ error: "Channel service internal error" })
		},
	)

	return app
}