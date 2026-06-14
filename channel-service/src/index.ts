import { createChannelApp } from "./app"
import { logger } from "./utils/logger"

const PORT = Number(process.env.PORT ?? process.env.CHANNEL_PORT ?? 4100)

const app = createChannelApp()

app.listen(PORT, () => {
    logger.info(`Reachly Channel Service (stub) listening on port ${PORT}`)
})