export interface FormatterOptions {
	stripWwwSubdomain: boolean;
	stripWwwPlusSubdomain: boolean;
	stripMobileSubdomain: boolean;
	stripAmpSubdomain: boolean;
}

export const DEFAULT_FORMATTER_OPTIONS: FormatterOptions = {
	stripWwwSubdomain: true,
	stripWwwPlusSubdomain: true,
	stripMobileSubdomain: true,
	stripAmpSubdomain: true,
};

export function prettyUrl(url: string, options: FormatterOptions = DEFAULT_FORMATTER_OPTIONS): string {
	url = url.replace(/^https?:\/\//i, '');

	if (options.stripWwwSubdomain) {
		if (options.stripWwwPlusSubdomain) {
			url = url.replace(/^www\d?\./i, '');
		} else {
			url = url.replace(/^www\./i, '');
		}
	}

	if (options.stripMobileSubdomain) {
		url = url.replace(/^(m|mobile)\./i, '');
	}

	if (options.stripAmpSubdomain) {
		url = url.replace(/^(amp|wap)\./i, '');
	}

	// Strip trailing slash from path-less URLs (e.g., "example.com/" -> "example.com")
	url = url.replace(/^([^/]+)\/$/, '$1');

	return url;
}

export function isExternalUrl(url: string): boolean {
	return url.includes('://');
}
