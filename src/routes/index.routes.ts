import { Router } from "express"

import customerRoutes from "./customers.routes"
import orderRoutes from "./orders.routes"
import ingestionRoutes from "./ingestion.routes"
import segmentRoutes from "./segments.routes"
import aiRoutes from "./ai.routes"
import campaignRoutes from "./campaigns.routes"
import receiptRoutes from "./receipts.routes"
import communicationRoutes from "./communications.routes"
import agentRoutes from "./agent.routes"
import analyticsRoutes from "./analytics.routes"

const router = Router()

router.use("/customers", customerRoutes)
router.use("/orders", orderRoutes)
router.use("/ingest", ingestionRoutes)
router.use("/segments", segmentRoutes)
router.use("/ai", aiRoutes)
router.use("/campaigns", campaignRoutes)
router.use("/receipts", receiptRoutes)
router.use("/communications", communicationRoutes)
router.use("/agent", agentRoutes)
router.use("/analytics", analyticsRoutes)

export default router
