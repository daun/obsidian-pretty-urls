/**
 * @vitest-environment jsdom
 */
/* eslint-disable @microsoft/sdl/no-inner-html */
import {describe, it, expect} from 'vitest';
import {isUrlOnlyLink, isUrlOnlyMetadataLink, LINK_SELECTOR, METADATA_LINK_SELECTOR} from '../src/detector';

function createAnchor(href: string, textContent: string): HTMLAnchorElement {
	const anchor = document.createElement('a');
	anchor.href = href;
	anchor.textContent = textContent;
	return anchor;
}

function createMetadataLink(href: string, textContent: string): HTMLDivElement {
	const div = document.createElement('div');
	div.className = 'metadata-link-inner';
	div.dataset.href = href;
	div.textContent = textContent;
	return div;
}

describe('LINK_SELECTOR', () => {
	it('matches anchor elements with protocol in href', () => {
		const container = document.createElement('div');
		container.innerHTML = `
			<a href="https://example.com">Link 1</a>
			<a href="http://example.com">Link 2</a>
			<a href="/relative/path">Link 3</a>
			<a href="ftp://files.example.com">Link 4</a>
		`;
		const matches = container.querySelectorAll(LINK_SELECTOR);
		expect(matches.length).toBe(3);
	});
});

describe('METADATA_LINK_SELECTOR', () => {
	it('matches metadata link elements with protocol in data-href', () => {
		const container = document.createElement('div');
		container.innerHTML = `
			<div class="metadata-link-inner" data-href="https://example.com">Link 1</div>
			<div class="metadata-link-inner" data-href="/relative">Link 2</div>
			<div class="other-class" data-href="https://example.com">Link 3</div>
		`;
		const matches = container.querySelectorAll(METADATA_LINK_SELECTOR);
		expect(matches.length).toBe(1);
	});
});

describe('isUrlOnlyLink', () => {
	describe('URL-only links (should be detected)', () => {
		it('detects link where text exactly matches href', () => {
			const anchor = createAnchor('https://example.com', 'https://example.com');
			expect(isUrlOnlyLink(anchor)).toBe(true);
		});

		it('detects link with path where text matches href', () => {
			const anchor = createAnchor('https://example.com/path/to/page', 'https://example.com/path/to/page');
			expect(isUrlOnlyLink(anchor)).toBe(true);
		});

		it('detects link with query params where text matches href', () => {
			const anchor = createAnchor('https://example.com?foo=bar', 'https://example.com?foo=bar');
			expect(isUrlOnlyLink(anchor)).toBe(true);
		});
	});

	describe('trailing slash handling', () => {
		it('detects link where href has trailing slash but text does not', () => {
			const anchor = createAnchor('https://example.com/', 'https://example.com');
			expect(isUrlOnlyLink(anchor)).toBe(true);
		});

		it('detects link where text has trailing slash but href does not', () => {
			const anchor = createAnchor('https://example.com', 'https://example.com/');
			expect(isUrlOnlyLink(anchor)).toBe(true);
		});

		it('preserves trailing slash difference for URLs with paths', () => {
			// When there's a real path, trailing slash difference matters
			const anchor = createAnchor('https://example.com/path/', 'https://example.com/path');
			expect(isUrlOnlyLink(anchor)).toBe(false);
		});
	});

	describe('customized links (should be ignored)', () => {
		it('ignores link with custom label text', () => {
			const anchor = createAnchor('https://example.com', 'Example Website');
			expect(isUrlOnlyLink(anchor)).toBe(false);
		});

		it('ignores link with shortened label', () => {
			const anchor = createAnchor('https://example.com/very/long/path', 'example.com');
			expect(isUrlOnlyLink(anchor)).toBe(false);
		});

		it('ignores link with descriptive label', () => {
			const anchor = createAnchor('https://github.com/user/repo', 'View on GitHub');
			expect(isUrlOnlyLink(anchor)).toBe(false);
		});

		it('ignores link with emoji in label', () => {
			const anchor = createAnchor('https://example.com', '🔗 https://example.com');
			expect(isUrlOnlyLink(anchor)).toBe(false);
		});

		it('ignores link with different protocol in label', () => {
			const anchor = createAnchor('https://example.com', 'http://example.com');
			expect(isUrlOnlyLink(anchor)).toBe(false);
		});
	});

	describe('links with child elements (should be ignored)', () => {
		it('ignores link containing an image', () => {
			const anchor = document.createElement('a');
			anchor.href = 'https://example.com';
			anchor.innerHTML = '<img src="icon.png" alt=""> https://example.com';
			expect(isUrlOnlyLink(anchor)).toBe(false);
		});

		it('ignores link with styled text', () => {
			const anchor = document.createElement('a');
			anchor.href = 'https://example.com';
			anchor.innerHTML = '<strong>https://example.com</strong>';
			expect(isUrlOnlyLink(anchor)).toBe(false);
		});
	});

	describe('non-external links (should be ignored)', () => {
		it('ignores relative links', () => {
			const anchor = createAnchor('/path/to/page', '/path/to/page');
			expect(isUrlOnlyLink(anchor)).toBe(false);
		});

		it('ignores anchor-only links', () => {
			const anchor = createAnchor('#section', '#section');
			expect(isUrlOnlyLink(anchor)).toBe(false);
		});
	});

	describe('non-anchor elements (should be ignored)', () => {
		it('returns false for non-anchor elements', () => {
			const div = document.createElement('div');
			div.textContent = 'https://example.com';
			expect(isUrlOnlyLink(div)).toBe(false);
		});

		it('returns false for text nodes', () => {
			const text = document.createTextNode('https://example.com');
			expect(isUrlOnlyLink(text)).toBe(false);
		});
	});
});

describe('isUrlOnlyMetadataLink', () => {
	describe('URL-only metadata links (should be detected)', () => {
		it('detects metadata link where text exactly matches data-href', () => {
			const div = createMetadataLink('https://example.com', 'https://example.com');
			expect(isUrlOnlyMetadataLink(div)).toBe(true);
		});

		it('detects metadata link with path', () => {
			const div = createMetadataLink('https://example.com/path', 'https://example.com/path');
			expect(isUrlOnlyMetadataLink(div)).toBe(true);
		});
	});

	describe('trailing slash handling', () => {
		it('detects metadata link where href has trailing slash but text does not', () => {
			const div = createMetadataLink('https://example.com/', 'https://example.com');
			expect(isUrlOnlyMetadataLink(div)).toBe(true);
		});

		it('detects metadata link where text has trailing slash but href does not', () => {
			const div = createMetadataLink('https://example.com', 'https://example.com/');
			expect(isUrlOnlyMetadataLink(div)).toBe(true);
		});
	});

	describe('customized metadata links (should be ignored)', () => {
		it('ignores metadata link with custom label', () => {
			const div = createMetadataLink('https://example.com', 'My Website');
			expect(isUrlOnlyMetadataLink(div)).toBe(false);
		});
	});

	describe('non-div elements (should be ignored)', () => {
		it('returns false for anchor elements', () => {
			const anchor = createAnchor('https://example.com', 'https://example.com');
			expect(isUrlOnlyMetadataLink(anchor)).toBe(false);
		});
	});

	describe('missing data-href (should be ignored)', () => {
		it('returns false when data-href is not set', () => {
			const div = document.createElement('div');
			div.textContent = 'https://example.com';
			expect(isUrlOnlyMetadataLink(div)).toBe(false);
		});
	});
});
