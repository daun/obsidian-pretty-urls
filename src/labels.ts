export interface LabelRule {
	id: string;
	pattern: string;
	replacement: string;
	enabled: boolean;
}

export const DEFAULT_LABEL_RULES: LabelRule[] = [
	{
		id: 'wikipedia',
		pattern: '^(?:[a-z]{2,3}\\.)?wikipedia\\.org/wiki/(.+)$',
		replacement: 'Wikipedia: $1',
		enabled: false,
	},
	{
		id: 'github',
		pattern: '^github\\.com/([^/]+)/([^/]+)/?$',
		replacement: 'GitHub: $1/$2',
		enabled: false,
	},
	{
		id: 'reddit',
		pattern: '^reddit\\.com/r/([^/]+)/?$',
		replacement: 'r/$1',
		enabled: false,
	},
];

// Compile cache keyed by pattern string. Invalid patterns cache null.
const compileCache = new Map<string, RegExp | null>();

/**
 * Compile a label rule pattern to a RegExp with the `i` flag.
 * Returns null for invalid patterns. Results are cached.
 */
export function compileRule(pattern: string): RegExp | null {
	if (compileCache.has(pattern)) {
		return compileCache.get(pattern)!;
	}
	try {
		const re = new RegExp(pattern, 'i');
		compileCache.set(pattern, re);
		return re;
	} catch {
		compileCache.set(pattern, null);
		return null;
	}
}

/**
 * Apply enabled label rules to a stripped URL (post-strip, e.g. "github.com/x/y").
 * Returns the rewritten label on first match, or null if no rule applied or
 * the output is empty/whitespace.
 */
export function applyLabelRules(strippedUrl: string, rules: LabelRule[]): string | null {
	for (const rule of rules) {
		if (!rule.enabled) continue;
		const re = compileRule(rule.pattern);
		if (!re) continue;
		try {
			if (!re.test(strippedUrl)) continue;
			const result = strippedUrl.replace(re, rule.replacement);
			if (result.trim() !== '') return result;
		} catch {
			// Regex execution error — skip this rule
		}
	}
	return null;
}

/**
 * Non-blocking heuristic: returns true if the pattern looks like it could
 * exhibit slow backtracking (nested unbounded quantifiers).
 */
export function looksExpensive(pattern: string): boolean {
	return /\([^()]*[+*][^()]*\)[+*]/.test(pattern);
}
