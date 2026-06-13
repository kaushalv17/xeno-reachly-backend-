import { z } from "zod"

export const customerInput = z.object({
	name: z.string().min(1, "name is required"),
	email: z.string().email(),
	phone: z.string().optional(),
	city: z.string().optional(),
	country: z.string().optional(),
	tags: z.array(z.string()).optional(),
})

// Accept a single object OR an array (bulk)
export const customerBulkInput = z.union([customerInput, z.array(customerInput).min(1)])

export type CustomerInput = z.infer<typeof customerInput>