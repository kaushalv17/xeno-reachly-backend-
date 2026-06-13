import { GoogleGenerativeAI } from "@google/generative-ai"
import { env } from "../../config/env"
import { ApiError } from "../../utils/ApiError"

// Override via GEMINI_MODEL in .env if your key needs a different model
const MODEL = process.env.GEMINI_MODEL ?? "gemini-1.5-flash"

let client: GoogleGenerativeAI | null = null
function getClient() {
	if (!env.GEMINI_API_KEY) {
		throw ApiError.badRequest(
			"GEMINI_API_KEY is not set. Add it to backend/.env and restart the server.",
		)
	}
	if (!client) client = new GoogleGenerativeAI(env.GEMINI_API_KEY)
	return client
}

// Ask Gemini for a JSON object (uses JSON response mode for reliability)
export async function generateJson<T = unknown>(args: {
	system: string
	user: string
}): Promise<T> {
	const model = getClient().getGenerativeModel({
		model: MODEL,
		systemInstruction: args.system,
		generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
	})
	const result = await model.generateContent(args.user)
	const text = result.response.text()
	try {
		return JSON.parse(text) as T
	} catch {
		const cleaned = text.replace(/```json|```/g, "").trim()
		return JSON.parse(cleaned) as T
	}
}

// Plain-text generation (used by later commits for message drafting/insights)
export async function generateText(args: { system: string; user: string }): Promise<string> {
	const model = getClient().getGenerativeModel({
		model: MODEL,
		systemInstruction: args.system,
		generationConfig: { temperature: 0.7 },
	})
	const result = await model.generateContent(args.user)
	return result.response.text()
}