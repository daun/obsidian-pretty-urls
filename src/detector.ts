import {isExternalUrl} from "./formatter";

export const LINK_SELECTOR = 'a[href*="://"]';
export const METADATA_LINK_SELECTOR = '.metadata-link-inner[data-href*="://"]';

/**
 * Checks if two URLs match, allowing for trailing slash differences on path-less URLs.
 * Handles browser normalization where:
 * - "https://example.com" becomes "https://example.com/"
 * - "https://example.com?q=1" becomes "https://example.com/?q=1"
 */
function urlsMatchIgnoringTrailingSlash(url1: string, url2: string): boolean {
	if (url1 === url2) return true;

	// Normalize by removing trailing slash on path-less URLs (before query/hash if present)
	const normalize = (url: string) => url.replace(/^([^/]*:\/\/[^/?#]+)\/([?#]|$)/, '$1$2');
	return normalize(url1) === normalize(url2);
}

export function isUrlOnlyLink(node: Node): node is HTMLAnchorElement {
	return node instanceof HTMLAnchorElement
		&& isExternalUrl(node.href)
		&& urlsMatchIgnoringTrailingSlash(node.href, node.textContent ?? '')
		&& node.childElementCount === 0;
}

export function isUrlOnlyMetadataLink(node: Node): node is HTMLDivElement {
	return node instanceof HTMLDivElement
		&& node.dataset.href !== undefined
		&& isExternalUrl(node.dataset.href)
		&& urlsMatchIgnoringTrailingSlash(node.dataset.href, node.textContent ?? '')
		&& node.childElementCount === 0;
}
