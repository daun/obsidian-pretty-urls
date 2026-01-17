import {describe, it, expect} from 'vitest';
import {prettyUrl, isExternalUrl, FormatterOptions, DEFAULT_FORMATTER_OPTIONS} from './formatter';

describe('prettyUrl', () => {
	describe('protocol stripping', () => {
		it('strips https:// protocol', () => {
			expect(prettyUrl('https://example.com')).toBe('example.com');
		});

		it('strips http:// protocol', () => {
			expect(prettyUrl('http://example.com')).toBe('example.com');
		});

		it('strips protocol case-insensitively', () => {
			expect(prettyUrl('HTTPS://example.com')).toBe('example.com');
			expect(prettyUrl('HTTP://example.com')).toBe('example.com');
			expect(prettyUrl('Https://example.com')).toBe('example.com');
		});

		it('preserves path after domain', () => {
			expect(prettyUrl('https://example.com/path/to/page')).toBe('example.com/path/to/page');
		});

		it('preserves query parameters', () => {
			expect(prettyUrl('https://example.com?foo=bar')).toBe('example.com?foo=bar');
		});

		it('preserves fragment identifiers', () => {
			expect(prettyUrl('https://example.com#section')).toBe('example.com#section');
		});

		it('preserves port numbers', () => {
			expect(prettyUrl('https://example.com:8080')).toBe('example.com:8080');
		});
	});

	describe('www subdomain stripping', () => {
		it('strips www. subdomain by default', () => {
			expect(prettyUrl('https://www.example.com')).toBe('example.com');
		});

		it('strips www. case-insensitively', () => {
			expect(prettyUrl('https://WWW.example.com')).toBe('example.com');
			expect(prettyUrl('https://Www.example.com')).toBe('example.com');
		});

		it('strips www1. subdomain by default', () => {
			expect(prettyUrl('https://www1.example.com')).toBe('example.com');
		});

		it('strips www2. subdomain by default', () => {
			expect(prettyUrl('https://www2.example.com')).toBe('example.com');
		});

		it('does not strip www. when disabled', () => {
			const options: FormatterOptions = {
				...DEFAULT_FORMATTER_OPTIONS,
				stripWwwSubdomain: false,
			};
			expect(prettyUrl('https://www.example.com', options)).toBe('www.example.com');
		});

		it('strips www. but not www1. when stripWwwPlusSubdomain is disabled', () => {
			const options: FormatterOptions = {
				...DEFAULT_FORMATTER_OPTIONS,
				stripWwwPlusSubdomain: false,
			};
			expect(prettyUrl('https://www.example.com', options)).toBe('example.com');
			expect(prettyUrl('https://www1.example.com', options)).toBe('www1.example.com');
			expect(prettyUrl('https://www2.example.com', options)).toBe('www2.example.com');
		});
	});

	describe('mobile subdomain stripping', () => {
		it('strips m. subdomain by default', () => {
			expect(prettyUrl('https://m.example.com')).toBe('example.com');
		});

		it('strips mobile. subdomain by default', () => {
			expect(prettyUrl('https://mobile.example.com')).toBe('example.com');
		});

		it('strips mobile subdomains case-insensitively', () => {
			expect(prettyUrl('https://M.example.com')).toBe('example.com');
			expect(prettyUrl('https://MOBILE.example.com')).toBe('example.com');
		});

		it('does not strip mobile subdomains when disabled', () => {
			const options: FormatterOptions = {
				...DEFAULT_FORMATTER_OPTIONS,
				stripMobileSubdomain: false,
			};
			expect(prettyUrl('https://m.example.com', options)).toBe('m.example.com');
			expect(prettyUrl('https://mobile.example.com', options)).toBe('mobile.example.com');
		});
	});

	describe('amp/wap subdomain stripping', () => {
		it('strips amp. subdomain by default', () => {
			expect(prettyUrl('https://amp.example.com')).toBe('example.com');
		});

		it('strips wap. subdomain by default', () => {
			expect(prettyUrl('https://wap.example.com')).toBe('example.com');
		});

		it('strips amp/wap subdomains case-insensitively', () => {
			expect(prettyUrl('https://AMP.example.com')).toBe('example.com');
			expect(prettyUrl('https://WAP.example.com')).toBe('example.com');
		});

		it('does not strip amp/wap subdomains when disabled', () => {
			const options: FormatterOptions = {
				...DEFAULT_FORMATTER_OPTIONS,
				stripAmpSubdomain: false,
			};
			expect(prettyUrl('https://amp.example.com', options)).toBe('amp.example.com');
			expect(prettyUrl('https://wap.example.com', options)).toBe('wap.example.com');
		});
	});

	describe('combined stripping', () => {
		it('strips www and protocol together', () => {
			expect(prettyUrl('https://www.example.com/page')).toBe('example.com/page');
		});

		it('handles all options disabled', () => {
			const options: FormatterOptions = {
				stripWwwSubdomain: false,
				stripWwwPlusSubdomain: false,
				stripMobileSubdomain: false,
				stripAmpSubdomain: false,
			};
			expect(prettyUrl('https://www.example.com', options)).toBe('www.example.com');
			expect(prettyUrl('https://m.example.com', options)).toBe('m.example.com');
			expect(prettyUrl('https://amp.example.com', options)).toBe('amp.example.com');
		});
	});

	describe('edge cases', () => {
		it('handles URLs without protocol', () => {
			expect(prettyUrl('example.com')).toBe('example.com');
		});

		it('handles URLs with subdomains that are not stripped', () => {
			expect(prettyUrl('https://api.example.com')).toBe('api.example.com');
			expect(prettyUrl('https://blog.example.com')).toBe('blog.example.com');
		});

		it('does not strip www from middle of domain', () => {
			expect(prettyUrl('https://example.www.com')).toBe('example.www.com');
		});

		it('does not strip m from middle of domain', () => {
			expect(prettyUrl('https://example.m.com')).toBe('example.m.com');
		});

		it('handles empty string', () => {
			expect(prettyUrl('')).toBe('');
		});

		it('handles complex URLs with all components', () => {
			expect(prettyUrl('https://www.example.com:8080/path?query=value#fragment'))
				.toBe('example.com:8080/path?query=value#fragment');
		});

		it('handles international domain names', () => {
			expect(prettyUrl('https://www.例え.jp')).toBe('例え.jp');
		});

		it('handles URLs with authentication', () => {
			expect(prettyUrl('https://user:pass@www.example.com')).toBe('user:pass@www.example.com');
		});

		it('handles ftp:// and other protocols (does not strip)', () => {
			expect(prettyUrl('ftp://example.com')).toBe('ftp://example.com');
		});

		it('strips trailing slash from path-less URLs', () => {
			expect(prettyUrl('https://example.com/')).toBe('example.com');
			expect(prettyUrl('https://www.example.com/')).toBe('example.com');
		});

		it('preserves trailing slash on URLs with paths', () => {
			expect(prettyUrl('https://example.com/path/')).toBe('example.com/path/');
			expect(prettyUrl('https://example.com/path/to/page/')).toBe('example.com/path/to/page/');
		});
	});
});

describe('isExternalUrl', () => {
	it('returns true for https URLs', () => {
		expect(isExternalUrl('https://example.com')).toBe(true);
	});

	it('returns true for http URLs', () => {
		expect(isExternalUrl('http://example.com')).toBe(true);
	});

	it('returns true for ftp URLs', () => {
		expect(isExternalUrl('ftp://example.com')).toBe(true);
	});

	it('returns true for custom protocol URLs', () => {
		expect(isExternalUrl('obsidian://open')).toBe(true);
	});

	it('returns false for relative paths', () => {
		expect(isExternalUrl('/path/to/file')).toBe(false);
		expect(isExternalUrl('./relative/path')).toBe(false);
	});

	it('returns false for plain text', () => {
		expect(isExternalUrl('example.com')).toBe(false);
		expect(isExternalUrl('just some text')).toBe(false);
	});

	it('returns false for empty string', () => {
		expect(isExternalUrl('')).toBe(false);
	});

	it('returns false for internal links', () => {
		expect(isExternalUrl('[[internal link]]')).toBe(false);
	});
});
