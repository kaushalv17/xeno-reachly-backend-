import { customerService } from "./customer.service"
import { orderService } from "./order.service"
import { CustomerInput } from "../validators/customer.schema"
import { OrderInput } from "../validators/order.schema"

export const ingestionService = {
	// Customers first (so orders can resolve by email), then orders
	async ingest(payload: { customers?: CustomerInput[]; orders?: OrderInput[] }) {
		const customers = payload.customers?.length
			? await customerService.upsertMany(payload.customers)
			: []
		const orders = payload.orders?.length
			? await orderService.createMany(payload.orders)
			: []
		return { customersIngested: customers.length, ordersIngested: orders.length }
	},
}