import {describe, it, expect} from 'vitest';
import {LabelRule, DEFAULT_LABEL_RULES, compileRule, applyLabelRules, looksExpensive} from '../src/labels';

describe('compileRule', () => {
	it('compiles a valid pattern to a RegExp', () => {
		const re = compileRule('^github\\.com/([^/]+)/([^/]+)');
		expect(re).toBeInstanceOf(RegExp);
	});

	it('always uses case-insensitive flag', () => {
		const re = compileRule('example');
		expect(re?.flags).toContain('i');
	});

	it('returns null for invalid patterns', () => {
		expect(compileRule('([invalid')).toBeNull();
		expect(compileRule('*invalid')).toBeNull();
	});

	it('caches compiled regex across calls', () => {
		const re1 = compileRule('^foo\\.com');
		const re2 = compileRule('^foo\\.com');
		expect(re1).toBe(re2);
	});

	it('caches null for invalid patterns', () => {
		const r1 = compileRule('(unclosed');
		const r2 = compileRule('(unclosed');
		expect(r1).toBeNull();
		expect(r2).toBeNull();
	});
});

describe('applyLabelRules', () => {
	const makeRule = (pattern: string, replacement: string, enabled = true, id = 'test'): LabelRule => ({
		id,
		pattern,
		replacement,
		enabled,
	});

	it('returns templated label on match with capture groups', () => {
		const rules = [makeRule('^github\\.com/([^/]+)/([^/]+)/?$', 'GitHub: $1/$2')];
		expect(applyLabelRules('github.com/daun/obsidian-pretty-urls', rules)).toBe('GitHub: daun/obsidian-pretty-urls');
	});

	it('returns null when no rule matches', () => {
		const rules = [makeRule('^github\\.com/([^/]+)/([^/]+)/?$', 'GitHub: $1/$2')];
		expect(applyLabelRules('example.com/path', rules)).toBeNull();
	});

	it('returns null for invalid regex — no throw', () => {
		const rules = [makeRule('([invalid', 'Label')];
		expect(() => applyLabelRules('anything', rules)).not.toThrow();
		expect(applyLabelRules('anything', rules)).toBeNull();
	});

	it('implements first-match-wins', () => {
		const rules = [
			makeRule('^github\\.com/([^/]+)/([^/]+)/?$', 'First: $1/$2', true, 'a'),
			makeRule('^github\\.com/([^/]+)/([^/]+)/?$', 'Second: $1/$2', true, 'b'),
		];
		expect(applyLabelRules('github.com/x/y', rules)).toBe('First: x/y');
	});

	it('skips disabled rules', () => {
		const rules = [
			makeRule('^github\\.com/([^/]+)/([^/]+)/?$', 'Disabled: $1/$2', false, 'a'),
			makeRule('^github\\.com/([^/]+)/([^/]+)/?$', 'Enabled: $1/$2', true, 'b'),
		];
		expect(applyLabelRules('github.com/x/y', rules)).toBe('Enabled: x/y');
	});

	it('treats empty replacement output as no-match and continues', () => {
		const rules = [
			makeRule('^github\\.com/([^/]+)/([^/]+)/?$', '   ', true, 'whitespace'),
			makeRule('^github\\.com/([^/]+)/([^/]+)/?$', 'GitHub: $1/$2', true, 'fallback'),
		];
		expect(applyLabelRules('github.com/x/y', rules)).toBe('GitHub: x/y');
	});

	it('returns null when all rules produce empty output', () => {
		const rules = [makeRule('^github\\.com/([^/]+)/([^/]+)/?$', '   ')];
		expect(applyLabelRules('github.com/x/y', rules)).toBeNull();
	});

	it('is case-insensitive', () => {
		const rules = [makeRule('^github\\.com/([^/]+)/([^/]+)/?$', 'GitHub: $1/$2')];
		expect(applyLabelRules('GITHUB.COM/User/Repo', rules)).toBe('GitHub: User/Repo');
	});

	it('returns null for empty rules array', () => {
		expect(applyLabelRules('github.com/x/y', [])).toBeNull();
	});
});

const ENABLED_DEFAULT_RULES = DEFAULT_LABEL_RULES.map(r => ({...r, enabled: true}));

describe('applyLabelRules — default rules', () => {
	it('matches Wikipedia URLs', () => {
		expect(applyLabelRules('en.wikipedia.org/wiki/The_Great_Gatsby', ENABLED_DEFAULT_RULES))
			.toBe('Wikipedia: The_Great_Gatsby');
	});

	it('matches Wikipedia URLs with different language codes', () => {
		expect(applyLabelRules('de.wikipedia.org/wiki/Berlin', ENABLED_DEFAULT_RULES))
			.toBe('Wikipedia: Berlin');
		expect(applyLabelRules('fr.wikipedia.org/wiki/Paris', ENABLED_DEFAULT_RULES))
			.toBe('Wikipedia: Paris');
	});

	it('matches Wikipedia URLs without a language code', () => {
		expect(applyLabelRules('wikipedia.org/wiki/Enshittification', ENABLED_DEFAULT_RULES))
			.toBe('Wikipedia: Enshittification');
	});

	it('matches GitHub repository URLs', () => {
		expect(applyLabelRules('github.com/daun/obsidian-pretty-urls', ENABLED_DEFAULT_RULES))
			.toBe('GitHub: daun/obsidian-pretty-urls');
	});

	it('matches GitHub repository URLs with trailing slash', () => {
		expect(applyLabelRules('github.com/daun/obsidian-pretty-urls/', ENABLED_DEFAULT_RULES))
			.toBe('GitHub: daun/obsidian-pretty-urls');
	});

	it('does not match GitHub user profile (no repo segment)', () => {
		expect(applyLabelRules('github.com/daun', ENABLED_DEFAULT_RULES)).toBeNull();
	});

	it('matches Reddit subreddit URLs', () => {
		expect(applyLabelRules('reddit.com/r/obsidian', ENABLED_DEFAULT_RULES)).toBe('r/obsidian');
	});

	it('matches Reddit subreddit URLs with trailing slash', () => {
		expect(applyLabelRules('reddit.com/r/obsidian/', ENABLED_DEFAULT_RULES)).toBe('r/obsidian');
	});

	it('does not match non-matching URLs', () => {
		expect(applyLabelRules('example.com', ENABLED_DEFAULT_RULES)).toBeNull();
		expect(applyLabelRules('youtube.com/watch?v=abc', ENABLED_DEFAULT_RULES)).toBeNull();
	});
});

describe('looksExpensive', () => {
	it('flags nested unbounded quantifiers: (a+)+', () => {
		expect(looksExpensive('(a+)+')).toBe(true);
	});

	it('flags nested unbounded quantifiers: (.*)* ', () => {
		expect(looksExpensive('(.*)*')).toBe(true);
	});

	it('flags: (\\w+\\s*)+', () => {
		expect(looksExpensive('(\\w+\\s*)+')).toBe(true);
	});

	it('does not flag simple quantifiers: \\w+', () => {
		expect(looksExpensive('\\w+')).toBe(false);
	});

	it('does not flag bounded character classes: [^/]+', () => {
		expect(looksExpensive('[^/]+')).toBe(false);
	});

	it('does not flag typical URL patterns', () => {
		expect(looksExpensive('^github\\.com/([^/]+)/([^/]+)/?$')).toBe(false);
		expect(looksExpensive('^[a-z]{2,3}\\.wikipedia\\.org/wiki/(.+)$')).toBe(false);
	});

	it('does not flag groups without quantifiers', () => {
		expect(looksExpensive('(foo|bar)')).toBe(false);
	});
});
