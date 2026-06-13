import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// ---------- helpers ----------
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = <T>(arr: T[]): T => arr[rand(0, arr.length - 1)]
const pickSome = <T>(arr: T[], n: number): T[] =>
	[...arr].sort(() => Math.random() - 0.5).slice(0, n)
const round2 = (n: number) => Math.round(n * 100) / 100
const daysAgo = (n: number) => {
	const d = new Date()
	d.setDate(d.getDate() - n)
	d.setHours(rand(8, 22), rand(0, 59), 0, 0)
	return d
}

// ---------- data pools ----------
const firstNames = [
	"Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Krishna",
	"Ishaan", "Rohan", "Aanya", "Diya", "Saanvi", "Aadhya", "Ananya", "Pari",
	"Myra", "Anika", "Navya", "Riya", "Kabir", "Dhruv", "Kunal", "Nikhil",
	"Rahul", "Priya", "Neha", "Pooja", "Sneha", "Kavya", "Meera", "Tara",
	"Ishita", "Aishwarya", "Karan", "Varun", "Siddharth", "Aryan", "Yash", "Manish",
]
const lastNames = [
	"Sharma", "Verma", "Gupta", "Iyer", "Nair", "Reddy", "Rao", "Patel", "Shah",
	"Mehta", "Joshi", "Desai", "Kapoor", "Malhotra", "Chopra", "Bose", "Banerjee",
	"Singh", "Kaur", "Khan", "Pillai", "Menon", "Agarwal", "Bansal", "Yadav",
	"Jain", "Mishra", "Chauhan",
]
const cities = [
	"Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Pune",
	"Ahmedabad", "Jaipur", "Surat", "Lucknow", "Chandigarh", "Indore", "Kochi", "Nagpur",
]
const tagPool = [
	"festive-shopper", "discount-hunter", "wholesale", "app-user",
	"newsletter", "referral", "gift-buyer", "premium",
]
const domains = ["gmail.com", "outlook.com", "yahoo.in", "hey.com"]

// ---------- personas (drive realistic distributions) ----------
type Persona = "champion" | "loyal" | "bigOneTime" | "atRisk" | "newbie" | "windowShopper"

const personaPool: { name: Persona; weight: number }[] = [
	{ name: "champion", weight: 12 },
	{ name: "loyal", weight: 30 },
	{ name: "bigOneTime", weight: 15 },
	{ name: "atRisk", weight: 20 },
	{ name: "newbie", weight: 15 },
	{ name: "windowShopper", weight: 8 },
]

const personaConfig: Record<
	Persona,
	{ orders: [number, number]; amount: [number, number]; days: [number, number]; tags: string[] }
> = {
	champion:      { orders: [5, 12], amount: [1500, 8000],  days: [1, 120],   tags: ["vip", "loyal"] },
	loyal:         { orders: [3, 7],  amount: [800, 4000],   days: [1, 60],    tags: ["loyal"] },
	bigOneTime:    { orders: [1, 1],  amount: [12000, 25000], days: [10, 90],  tags: ["high-value"] },
	atRisk:        { orders: [2, 6],  amount: [700, 3500],   days: [120, 330], tags: ["at-risk"] },
	newbie:        { orders: [1, 2],  amount: [199, 1500],   days: [1, 21],    tags: ["new"] },
	windowShopper: { orders: [0, 0],  amount: [0, 0],        days: [0, 0],     tags: ["cart-abandoner"] },
}

function pickPersona(): Persona {
	const total = personaPool.reduce((s, p) => s + p.weight, 0)
	let r = rand(1, total)
	for (const p of personaPool) {
		if (r <= p.weight) return p.name
		r -= p.weight
	}
	return "loyal"
}

// ---------- seed ----------
async function main() {
	console.log("🌱 Seeding Reachly database...")

	// Clean slate (orders first due to FK)
	await prisma.order.deleteMany()
	await prisma.customer.deleteMany()

	const TOTAL = 200
	let totalOrders = 0
	let totalRevenue = 0

	for (let i = 0; i < TOTAL; i++) {
		const first = pick(firstNames)
		const last = pick(lastNames)
		const persona = pickPersona()
		const cfg = personaConfig[persona]
		const email = `${first}.${last}.${i}`.toLowerCase() + "@" + pick(domains)
		const tags = Array.from(new Set([...cfg.tags, ...pickSome(tagPool, rand(0, 2))]))

		const customer = await prisma.customer.create({
			data: {
				name: `${first} ${last}`,
				email,
				phone: `+91 ${rand(70000, 99999)}${rand(10000, 99999)}`,
				city: pick(cities),
				country: "India",
				tags,
			},
		})

		const orderCount = rand(cfg.orders[0], cfg.orders[1])
		const orderData = Array.from({ length: orderCount }, () => ({
			customerId: customer.id,
			amount: round2(rand(cfg.amount[0], cfg.amount[1])),
			items: rand(1, 6),
			status: "completed",
			createdAt: daysAgo(rand(cfg.days[0], cfg.days[1])),
		}))

		if (orderData.length) {
			await prisma.order.createMany({ data: orderData })
			const spend = round2(orderData.reduce((s, o) => s + o.amount, 0))
			const lastOrderAt = orderData.reduce(
				(m, o) => (o.createdAt > m ? o.createdAt : m),
				orderData[0].createdAt,
			)
			await prisma.customer.update({
				where: { id: customer.id },
				data: { totalSpend: spend, orderCount: orderData.length, lastOrderAt },
			})
			totalOrders += orderData.length
			totalRevenue += spend
		}
	}

	console.log(
		`✅ Seeded ${TOTAL} customers, ${totalOrders} orders, ₹${totalRevenue.toLocaleString("en-IN")} total revenue`,
	)
}

main()
	.catch((e) => {
		console.error("❌ Seed failed:", e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})