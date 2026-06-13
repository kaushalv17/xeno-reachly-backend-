
export function personalize(
	template: string,
	vars: Record<string, string | number | null | undefined>,
): string {
	return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) => {
		const value = vars[key]
		return value === null || value === undefined ? "" : String(value)
	})
}