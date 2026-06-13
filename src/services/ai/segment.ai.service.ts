import { generateJson } from "./ai.client"
import { segmentSystemPrompt, buildSegmentUserPrompt } from "./segment.prompt"
import { ruleGroupSchema, RuleGroup } from "../../rules/ruleSchema"
import { segmentService } from "../segment.service"
import { naiveParse } from "./segment.fallback"
import { logger } from "../../utils/logger"

export const aiSegmentService = {
	async fromNaturalLanguage(description: string) {
		let rule: RuleGroup
		let source: "gemini" | "fallback" = "gemini"

		try {
			const raw = await generateJson<unknown>({
				system: segmentSystemPrompt,
				user: buildSegmentUserPrompt(description),
			})
			const parsed = ruleGroupSchema.safeParse(raw)
			if (!parsed.success) throw new Error("AI returned an invalid rule shape")
			rule = parsed.data as RuleGroup
		} catch (err) {
			logger.warn(
				{ err: (err as Error).message },
				"Gemini unavailable — using deterministic fallback parser",
			)
			rule = naiveParse(description)
			source = "fallback"
		}

		const preview = await segmentService.preview(rule, 10)
		return { description, source, rule, ...preview }
	},
}