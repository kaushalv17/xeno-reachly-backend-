import { GoogleGenerativeAI } from "@google/generative-ai"
import { logger } from "../../utils/logger"

export type DraftChannel = "WHATSAPP" | "SMS" | "EMAIL" | "RCS"

export interface DraftRequest {
    goal: string
    channel: DraftChannel
    audienceSummary?: string
    tone?: string
    count?: number
}

export interface MessageVariant {
    label: string
    message: string
}

export interface DraftResult {
    source: "gemini" | "fallback"
    channel: DraftChannel
    variants: MessageVariant[]
}

// Build personalization braces without writing them literally.
const L = "{" + "{"
const R = "}" + "}"
const tok = (k: string) => L + k + R

const CHANNEL_LIMITS: Record<DraftChannel, string> = {
    SMS: "max 160 characters, plain text, one short sentence plus a CTA",
    WHATSAPP: "max 320 characters, warm, may use one emoji",
    EMAIL: "2-3 short sentences, may include a subject-style opener",
    RCS: "max 300 characters, punchy, may use one emoji",
}

function buildPrompt(req: DraftRequest, count: number): string {
    const tone = req.tone ?? "friendly, concise, on-brand"
    return [
        "You are a senior marketing copywriter for an e-commerce brand.",
        `Write ${count} distinct ${req.channel} message variants for this goal: "${req.goal}".`,
        req.audienceSummary ? `Audience: ${req.audienceSummary}.` : "",
        `Tone: ${tone}.`,
        `Channel constraints: ${CHANNEL_LIMITS[req.channel]}.`,
        `Personalize with the placeholders ${tok("name")} and ${tok("city")} where it reads naturally.`,
        'Return ONLY a JSON array, no markdown fences, shaped like:',
        '[{"label":"Variant A","message":"..."}]',
    ].filter(Boolean).join("\n")
}

function extractJsonArray(text: string): MessageVariant[] {
    const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim()
    const start = cleaned.indexOf("[")
    const end = cleaned.lastIndexOf("]")
    if (start === -1 || end === -1) throw new Error("no JSON array in model output")
    return JSON.parse(cleaned.slice(start, end + 1)) as MessageVariant[]
}

function fallbackVariants(req: DraftRequest, count: number): MessageVariant[] {
    const hi = `Hi ${tok("name")}`
    const city = tok("city")
    const g = req.goal.toLowerCase()
    const offer =
        g.includes("win") || g.includes("back") || g.includes("lapsed")
            ? "Here is 20% off to welcome you back"
            : g.includes("vip") || g.includes("loyal")
                ? "Here is an exclusive VIP reward"
                : "Here is something special just for you"
    const all: MessageVariant[] = [
        { label: "Variant A", message: `${hi}! We miss you in ${city}. ${offer} - shop now and enjoy.` },
        { label: "Variant B", message: `${hi}, your favourites are waiting. ${offer}. Tap to explore today.` },
        { label: "Variant C", message: `${hi}! A little treat from us: ${offer}. See you soon!` },
        { label: "Variant D", message: `${hi}, good news for ${city} shoppers - ${offer}. Limited time only.` },
        { label: "Variant E", message: `${hi}! Ready for a comeback? ${offer}, just for you.` },
    ]
    return all.slice(0, count)
}

export const draftService = {
    async draftMessages(req: DraftRequest): Promise<DraftResult> {
        const count = req.count ?? 3
        const apiKey = process.env.GEMINI_API_KEY ?? ""
        const modelName = process.env.GEMINI_MODEL ?? "gemini-2.0-flash"

        if (!apiKey) {
            logger.warn("No GEMINI_API_KEY set; using fallback drafts")
            return { source: "fallback", channel: req.channel, variants: fallbackVariants(req, count) }
        }

        try {
            const genAI = new GoogleGenerativeAI(apiKey)
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: { temperature: 0.7 },
            })
            const result = await model.generateContent(buildPrompt(req, count))
            const parsed = extractJsonArray(result.response.text())
            const variants = parsed
                .filter((v) => v && typeof v.message === "string" && v.message.trim().length > 0)
                .map((v, i) => ({ label: v.label ?? `Variant ${i + 1}`, message: v.message.trim() }))
                .slice(0, count)
            if (variants.length === 0) throw new Error("model returned no usable variants")
            return { source: "gemini", channel: req.channel, variants }
        } catch (err) {
            logger.warn({ err: (err as Error).message }, "Gemini draft failed; using fallback")
            return { source: "fallback", channel: req.channel, variants: fallbackVariants(req, count) }
        }
    },
}
