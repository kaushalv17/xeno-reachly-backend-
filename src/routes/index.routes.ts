import { Router } from "express"
import customersRoutes from "./customers.routes"
import ordersRoutes from "./orders.routes"
import ingestionRoutes from "./ingestion.routes"
import segmentsRoutes from "./segments.routes" // ← NEW

const router = Router()
router.use("/customers", customersRoutes)
router.use("/orders", ordersRoutes)
router.use("/ingest", ingestionRoutes)
router.use("/segments", segmentsRoutes) // ← NEW
export default router