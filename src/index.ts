import { createApp } from "./app"
import { env } from "./config/env"
import { prisma } from "./config/db"
import { logger } from "./utils/logger"

async function main() {
  await prisma.$connect()
  logger.info("✅ Connected to database")

  const app = createApp()
  app.listen(env.PORT, () => {
    logger.info(`🚀 Reachly CRM API listening on http://localhost:${env.PORT}`)
  })
}

main().catch((err) => {
  logger.error(err, "Failed to start server")
  process.exit(1)
})

async function shutdown() {
  logger.info("Shutting down...")
  await prisma.$disconnect()
  process.exit(0)
}
process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)