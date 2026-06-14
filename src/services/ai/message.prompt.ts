import type { DraftChannel } from "./draft.service"

const CHANNEL_LIMITS: Record<DraftChannel, string> = {
  SMS: "max 160 characters, plain text, one short sentence plus a CTA",
  WHATSAPP: "max 320 characters, warm, may use at most one emoji",
  EMAIL: "2-3 short sentences, may include a short subject-style opener",
  RCS: "max 300 characters, punchy, may use at most one emoji",
}

export const MESSAGE_DRAFT_SYSTEM =
  "You are a senior marketing copywriter for an e-commerce brand. " +
  "You craft concise, on-brand campaign messages that drive action. " +
  "You always respond with strictly valid JSON and never include markdown fences or commentary."

export interface MessageDraftPromptArgs {
  goal: string
  channel: DraftChannel
  audienceSummary?: string
  tone?: string
  count: number
}

export function buildMessageDraftUser(args: MessageDraftPromptArgs): string {
  const tone = args.tone ?? "friendly, concise, on-brand"
  return [
    `Write ${args.count} distinct ${args.channel} marketing message variants for this campaign goal: "${args.goal}".`,
    args.audienceSummary ? `Audience: ${args.audienceSummary}.` : "",
    `Tone: ${tone}.`,
    `Channel constraints: ${CHANNEL_LIMITS[args.channel]}.`,
    "Personalize naturally using the placeholders name and city. Keep the double curly braces exactly as written.",
    "Make each variant meaningfully different in angle, structure, or call-to-action.",
    "Do not invent specific discounts, prices, or claims beyond what the goal implies.",
    'Return ONLY JSON shaped exactly like: {"variants":[{"label":"Variant A","message":"..."},{"label":"Variant B","message":"..."}]}',
  ]
    .filter(Boolean)
    .join("\n")
}