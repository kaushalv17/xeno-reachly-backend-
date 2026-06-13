import { toolMap, type ToolContext } from "./tools"
import type { Channel } from "@prisma/client"
import type { RuleGroup } from "../../rules/ruleSchema"
import { logger } from "../../utils/logger"

export type AgentStep = {
tool: string
thought: string
input: unknown
output: unknown
}

export type AgentRunInput = {
goal: string
channel?: Channel
autoLaunch?: boolean
campaignName?: string
}

export type MessageVariant = { label: string; message: string }

export type AgentRunResult = {
goal: string
channel: Channel
planner: "gemini" | "deterministic"
steps: AgentStep[]
recommendation: {
rule: RuleGroup
audienceSize: number
recommendedMessage: string | null
messageVariants: MessageVariant[]
}
launched: boolean
status: "awaiting_approval" | "launched" | "no_audience"
campaign?: { campaignId: string; audienceSize: number; queued: number; status: string } | null
approvalHint?: string
}

async function callTool(
name: string,
input: unknown,
ctx: ToolContext,
steps: AgentStep[],
thought: string,
): Promise<any> {
const tool = toolMap[name]
if (!tool) throw new Error("Unknown tool: " + name)
const output = await tool.execute(input, ctx)
steps.push({ tool: name, thought, input, output })
return output
}

export const agentService = {
async run(input: AgentRunInput): Promise<AgentRunResult> {
const channel: Channel = input.channel ?? "WHATSAPP"
const ctx: ToolContext = { goal: input.goal, channel }
const steps: AgentStep[] = []

logger.info({ goal: input.goal, channel }, "Agent run started")

const translated = await callTool(
"translate_goal_to_segment_rules",
{},
ctx,
steps,
"Translate the goal into a structured segment rule.",
)
const rule = translated.rule as RuleGroup

const preview = await callTool(
"preview_audience",
{ rule },
ctx,
steps,
"Check how many shoppers match before drafting.",
)
const audienceSize: number = preview.audienceSize ?? 0

if (audienceSize === 0) {
return {
goal: input.goal,
channel,
planner: translated.source === "gemini" ? "gemini" : "deterministic",
steps,
recommendation: { rule, audienceSize: 0, recommendedMessage: null, messageVariants: [] },
launched: false,
status: "no_audience",
approvalHint: "No shoppers matched this goal. Try loosening the criteria.",
}
}

const drafts = await callTool(
"draft_messages",
{ audienceSummary: audienceSize + " shoppers" },
ctx,
steps,
"Draft personalised message variants for the audience.",
)
const messageVariants: MessageVariant[] = drafts.variants ?? []
const recommendedMessage =
messageVariants.length > 0 ? messageVariants[0].message : null

const planner: "gemini" | "deterministic" =
translated.source === "gemini" && drafts.source === "gemini"
? "gemini"
: "deterministic"

let launched = false
let status: AgentRunResult["status"] = "awaiting_approval"
let campaign: AgentRunResult["campaign"] = null

if (input.autoLaunch && recommendedMessage) {
campaign = await callTool(
"launch_campaign",
{ rule, messageTemplate: recommendedMessage, campaignName: input.campaignName },
ctx,
steps,
"Auto-launch approved: create and dispatch the campaign.",
)
launched = true
status = "launched"
}

return {
goal: input.goal,
channel,
planner,
steps,
recommendation: { rule, audienceSize, recommendedMessage, messageVariants },
launched,
status,
campaign,
approvalHint: launched
? undefined
: "Review the recommendation, then re-run with autoLaunch=true to dispatch.",
}
},
}
