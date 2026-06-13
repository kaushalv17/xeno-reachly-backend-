import { RuleGroup, Condition } from "../../rules/ruleSchema"

const CITIES = [
	"mumbai", "delhi", "bengaluru", "bangalore", "hyderabad", "ahmedabad",
	"chennai", "kolkata", "pune", "jaipur", "lucknow", "nagpur", "chandigarh",
	"surat", "indore",
]
const TAGS = ["vip", "loyal", "premium", "discount-hunter", "app-user", "wholesale", "festive-shopper"]

// Best-effort NL → rule parser. Used only when Gemini is unavailable.
export function naiveParse(description: string): RuleGroup {
	const text = description.toLowerCase()
	const conditions: Condition[] = []

	// Recency / win-back / inactivity
	const months = text.match(/(\d+)\s*month/)
	const weeks = text.match(/(\d+)\s*week/)
	const days = text.match(/(\d+)\s*day/)
	if (months) conditions.push({ field: "inactiveDays", operator: "gte", value: Number(months[1]) * 30 })
	else if (weeks) conditions.push({ field: "inactiveDays", operator: "gte", value: Number(weeks[1]) * 7 })
	else if (days) conditions.push({ field: "inactiveDays", operator: "gte", value: Number(days[1]) })
	else if (/win[\s-]?back|lapsed|inactive|haven'?t (ordered|bought|purchased)|dormant|churn/.test(text))
		conditions.push({ field: "inactiveDays", operator: "gte", value: 90 })

	// Spend
	const spend = text.match(/(?:₹|rs\.?|inr)?\s*(\d{3,})/)
	if (/big spender|high[\s-]?value|top spender|whale/.test(text))
		conditions.push({ field: "totalSpend", operator: "gte", value: 10000 })
	else if (/spent|spend|spending/.test(text) && spend)
		conditions.push({ field: "totalSpend", operator: "gte", value: Number(spend[1]) })

	// Orders / loyalty
	const orders = text.match(/(\d+)\s*\+?\s*orders?/)
	if (orders) conditions.push({ field: "orderCount", operator: "gte", value: Number(orders[1]) })
	else if (/loyal|frequent|repeat|regular/.test(text))
		conditions.push({ field: "orderCount", operator: "gte", value: 5 })

	// New customers
	if (/new customer|new shopper|recently joined|first[\s-]?time/.test(text))
		conditions.push({ field: "orderCount", operator: "lte", value: 1 })

	// City
	const city = CITIES.find((c) => text.includes(c))
	if (city) {
		const proper = city.charAt(0).toUpperCase() + city.slice(1)
		conditions.push({ field: "city", operator: "eq", value: proper === "Bangalore" ? "Bengaluru" : proper })
	}

	// Tags
	for (const tag of TAGS) {
		if (text.includes(tag) || text.includes(tag.replace("-", " ")))
			conditions.push({ field: "tags", operator: "contains", value: tag })
	}

	// Default: anyone who has ordered at least once
	if (conditions.length === 0)
		conditions.push({ field: "orderCount", operator: "gte", value: 1 })

	return { combinator: "and", conditions }
}