import { generateJson } from "./ai.client"
import { MESSAGE_DRAFT_SYSTEM, buildMessageDraftUser } from "./message.prompt"
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

// Build personalization braces without writing them literally in fallback copy.
const L = "{" + "{"
const R = "}" + "}"
const tok = (k: string) => L + k + R

function letterLabel(i: number): string {
  return `Variant ${String.fromCharCode(65 + i)}`
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
    try {
      const json = await generateJson<{ variants?: MessageVariant[] }>({
        system: MESSAGE_DRAFT_SYSTEM,
        user: buildMessageDraftUser({
          goal: req.goal,
          channel: req.channel,
          audienceSummary: req.audienceSummary,
          tone: req.tone,
          count,
        }),
      })
      const variants = (json.variants ?? [])
        .filter((v) => v && typeof v.message === "string" && v.message.trim().length > 0)
        .map((v, i) => ({
          label: typeof v.label === "string" && v.label.trim() ? v.label.trim() : letterLabel(i),
          message: v.message.trim(),
        }))
        .slice(0, count)
      if (variants.length === 0) throw new Error("model returned no usable variants")
      return { source: "gemini", channel: req.channel, variants }
    } catch (err) {
      logger.warn({ err: (err as Error).message }, "Gemini draft failed; using fallback")
      return { source: "fallback", channel: req.channel, variants: fallbackVariants(req, count) }
    }
  },
}