import { Router } from "express"
import campaignRoutes from "./campaigns.routes"
import customersRoutes from "./customers.routes"
import ordersRoutes from "./orders.routes"
import ingestionRoutes from "./ingestion.routes"
import segmentsRoutes from "./segments.routes"
import aiRoutes from "./ai.routes"

const router = Router()
router.use("/customers", customersRoutes)
router.use("/orders", ordersRoutes)
router.use("/ingest", ingestionRoutes)
router.use("/segments", segmentsRoutes)
router.use("/ai", aiRoutes)
router.use("/campaigns", campaignRoutes)

export default router