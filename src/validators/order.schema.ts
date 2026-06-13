import { z } from "zod"

export const orderInput = z
	.object({
		// Link the order to a customer by id OR email (at least one required)
		customerId: z.string().optional(),
		email: z.string().email().optional(),
		amount: z.number().nonnegative(),
		items: z.number().int().positive().default(1),
		status: z.string().optional(),
		createdAt: z.string().datetime().optional(),
	})
	.refine((d) => d.customerId || d.email, {
		message: "Either customerId or email is required to link the order",
	})

export const orderBulkInput = z.union([orderInput, z.array(orderInput).min(1)])

export type OrderInput = z.infer<typeof orderInput>