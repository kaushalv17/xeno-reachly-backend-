// Random delay around a base value, so timings look real (never negative)
export function jitter(baseMs: number, spreadMs: number): number {
	const delta = Math.floor((Math.random() * 2 - 1) * spreadMs)
	return Math.max(0, baseMs + delta)
}

// Returns true with the given probability (0..1)
export function chance(probability: number): boolean {
	return Math.random() < probability
}

export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}