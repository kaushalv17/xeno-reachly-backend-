import express from "express"
import cors from "cors"
import { errorHandler, notFoundHandler } from "./middleware/error.middleware"

export function createApp() {
  const app = express()

  app.use(cors())
  app.use(express.json({ limit: "5mb" }))

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "reachly-crm", time: new Date().toISOString() })
  })

  // Feature routes are mounted in later commits:
  // app.use("/api", apiRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}