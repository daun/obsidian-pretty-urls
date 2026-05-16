/**
 * Polyfill for Obsidian's cross-window `instanceOf` extension on Node.
 * In production, Obsidian patches this onto the prototype for popout window safety.
 * In jsdom tests, a plain `instanceof` check is equivalent.
 */
if (typeof Node !== 'undefined') {
	const proto = Node.prototype as unknown as Record<string, unknown>;
	if (!proto['instanceOf']) {
		proto['instanceOf'] = function(this: Node, type: { new(): unknown }): boolean {
			// eslint-disable-next-line obsidianmd/prefer-instanceof
			return this instanceof type;
		};
	}
}
