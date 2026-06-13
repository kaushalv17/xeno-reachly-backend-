import { aiSegmentService } from "./segment.ai.service"
import { segmentService } from "../segment.service"
import { draftService } from "./draft.service"
import { campaignService } from "../campaign.service"
import type { Channel } from "@prisma/client"
import type { RuleGroup } from "../../rules/ruleSchema"

export type ToolContext = {
    goal: string
    channel: Channel
}

export interface AgentTool {
    name: string
    description: string
    parameters: Record<string, unknown>
    execute: (args: any, ctx: ToolContext) => Promise<any>
}

export const tools: AgentTool[] = [
    {
        name: "translate_goal_to_segment_rules",
        description:
            "Turn the marketer goal into a structured segment rule (Gemini, deterministic fallback).",
        parameters: { type: "object", properties: {} },
        async execute(_args, ctx) {
            const res = await aiSegmentService.fromNaturalLanguage(ctx.goal)
            return { source: res.source, rule: res.rule, audienceSize: res.audienceSize }
        },
    },
    {
        name: "preview_audience",
        description: "Count shoppers matching a segment rule and return a small sample.",
        parameters: {
            type: "object",
            properties: { rule: { type: "object" } },
            required: ["rule"],
        },
        async execute(args, _ctx) {
            return await segmentService.preview(args.rule as RuleGroup, 5)
        },
    },
    {
        name: "draft_messages",
        description:
            "Draft channel-appropriate, personalised message variants (Gemini, template fallback).",
        parameters: {
            type: "object",
            properties: { audienceSummary: { type: "string" } },
        },
        async execute(args, ctx) {
            return await draftService.draftMessages({
                goal: ctx.goal,
                channel: ctx.channel,
                audienceSummary: args.audienceSummary,
                count: 3,
            })
        },
    },
    {
        name: "launch_campaign",
        description:
            "Create a campaign for the rule + message, then launch it (enqueues dispatch jobs).",
        parameters: {
            type: "object",
            properties: {
                rule: { type: "object" },
                messageTemplate: { type: "string" },
                campaignName: { type: "string" },
                segmentName: { type: "string" },
            },
            required: ["rule", "messageTemplate"],
        },
        async execute(args, ctx) {
            const created = await campaignService.create({
                name: args.campaignName ?? "Reachly - " + ctx.goal.slice(0, 40),
                goal: ctx.goal,
                channel: ctx.channel,
                messageTemplate: args.messageTemplate,
                rule: args.rule as RuleGroup,
                segmentName: args.segmentName,
            })
            const launched = await campaignService.launch(created.campaign.id)
            return {
                campaignId: created.campaign.id,
                audienceSize: created.audienceSize,
                queued: launched.queued,
                status: launched.campaign.status,
            }
        },
    },
]

export const toolMap: Record<string, AgentTool> = Object.fromEntries(
    tools.map((t) => [t.name, t]),
)
