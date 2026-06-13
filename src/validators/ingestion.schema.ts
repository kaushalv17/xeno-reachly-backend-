import { z } from "zod"
import { customerInput } from "./customer.schema"
import { orderInput } from "./order.schema"

export const ingestInput = z
	.object({
		customers: z.array(customerInput).optional(),
		orders: z.array(orderInput).optional(),
	})
	.refine((d) => (d.customers?.length ?? 0) + (d.orders?.length ?? 0) > 0, {
		message: "Provide at least one customer or order",
	})