export type FunnelCounts = {
    total: number
    queued: number
    sent: number
    delivered: number
    read: number
    clicked: number
    converted: number
    failed: number
}

export type Rates = {
    deliveryRate: number
    readRate: number
    clickRate: number
    conversionRate: number
    failureRate: number
}

export const insightsSystemPrompt = [
    "You are a senior growth marketing analyst for an e-commerce CRM.",
    "You receive campaign performance numbers and write a short, punchy insight brief.",
    "Rules:",
    "- 3 to 5 bullet points, plain English, no fluff.",
    "- Call out the single biggest drop-off in the funnel.",
    "- Give one concrete, actionable recommendation.",
    "- Mention the conversion rate explicitly.",
    "- Do not invent numbers; only use what is provided.",
].join("\n")

export function buildInsightsUserPrompt(
    funnel: FunnelCounts,
    rates: Rates,
    scope: string,
): string {
    return [
        `Scope: ${scope}`,
        `Total recipients: ${funnel.total}`,
        `Sent: ${funnel.sent}`,
        `Delivered: ${funnel.delivered} (${rates.deliveryRate}% of total)`,
        `Read: ${funnel.read} (${rates.readRate}% of delivered)`,
        `Clicked: ${funnel.clicked} (${rates.clickRate}% of read)`,
        `Converted: ${funnel.converted} (${rates.conversionRate}% of total)`,
        `Failed: ${funnel.failed} (${rates.failureRate}% of total)`,
        "",
        "Write the insight brief now.",
    ].join("\n")
}

// Deterministic fallback used when Gemini is unavailable (quota / network).
export function buildFallbackInsights(
    funnel: FunnelCounts,
    rates: Rates,
): string {
    const lines: string[] = []
    lines.push(
        `Reached ${funnel.total} shoppers: ${funnel.delivered} delivered (${rates.deliveryRate}%), ${funnel.converted} converted (${rates.conversionRate}%).`,
    )

    const stages = [
        { label: "delivery", from: funnel.sent, to: funnel.delivered },
        { label: "open/read", from: funnel.delivered, to: funnel.read },
        { label: "click", from: funnel.read, to: funnel.clicked },
        { label: "conversion", from: funnel.clicked, to: funnel.converted },
    ]
    let worst = stages[0]
    let worstDrop = -1
    for (const s of stages) {
        const drop = s.from - s.to
        if (drop > worstDrop) {
            worstDrop = drop
            worst = s
        }
    }
    lines.push(
        `Biggest drop-off is at the ${worst.label} stage (${worst.from} to ${worst.to}).`,
    )

    if (funnel.failed > 0) {
        lines.push(
            `${funnel.failed} message(s) failed (${rates.failureRate}%); retries are automatic, but watch this if it climbs.`,
        )
    }

    if (rates.conversionRate < 20) {
        lines.push(
            "Recommendation: tighten the offer or personalise the copy further to lift conversion.",
        )
    } else {
        lines.push(
            "Recommendation: conversion is healthy; consider scaling this segment to a larger audience.",
        )
    }

    return lines.join("\n")
}

