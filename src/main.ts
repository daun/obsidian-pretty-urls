import {Plugin as BasePlugin, TFile} from "obsidian";

import {DEFAULT_SETTINGS, PluginSettings, MainSettingTab} from "./settings";

export default class Plugin extends BasePlugin {
	settings: PluginSettings;

	linkSelector: string = 'a[href*="://"]';
	frontmatterLinkSelector: string = '.metadata-link-inner[data-href*="://"]';

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new MainSettingTab(this.app, this));

		this.registerMarkdownPostProcessor(this.processMarkdownLinks.bind(this));

		if (this.settings.formatMetadata) {
			this.registerEvent(this.app.workspace.on('active-leaf-change', () => this.processMetadataLinks()))
		}
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<PluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	processMarkdownLinks(el: HTMLElement) {
		Array.from(el.querySelectorAll(this.linkSelector))
			.filter((node) => this.isUrlOnlyLink(node))
			.forEach((link) => this.formatLink(link));
	}

	async processMetadataLinks() {
		// Requires promise/interval to make sure we run after Obsidian has rendered the frontmatter panel
		// const activeFile = await this.awaitActiveFile();
		const activeFile = this.app.workspace.getActiveFile();

		console.log('Processing frontmatter', activeFile);

		if (!activeFile) return;

		// await new Promise((resolve) => setTimeout(resolve, 300));

		const selector = `.metadata-property-value ${this.frontmatterLinkSelector}`;
		Array.from(document.querySelectorAll(selector))
			.filter((node) => this.isUrlOnlyMetadataLink(node))
			.forEach((link) => {
				console.log('Found frontmatter link node:', link);
				this.formatMetadataLink(link)
			});
	}

	isUrlOnlyLink(node: Node): node is HTMLAnchorElement {
		return node instanceof HTMLAnchorElement
			&& node.href.includes('://')
			&& node.href === node.textContent
			&& node.childElementCount === 0;
	}

	formatLink(node: HTMLAnchorElement): void {
		node.textContent = this.prettyUrl(node.href);
	}

	isUrlOnlyMetadataLink(node: Node): node is HTMLDivElement {
		return node instanceof HTMLDivElement
			&& node.dataset.href !== undefined
			&& node.dataset.href.includes('://')
			&& node.dataset.href === node.textContent
			&& node.childElementCount === 0;
	}

	formatMetadataLink(node: HTMLDivElement): void {
		node.textContent = this.prettyUrl(node.dataset.href!);
	}

	prettyUrl(url: string): string {
		url = url.replace(/^https?:\/\//i, '');

		if (this.settings.stripWwwSubdomain) {
			if (this.settings.stripWwwPlusSubdomain) {
				url = url.replace(/^www\d?\./i, '');
			} else {
				url = url.replace(/^www\./i, '');
			}
		}

		if (this.settings.stripMobileSubdomain) {
			url = url.replace(/^(m|mobile)\./i, '');
		}

		if (this.settings.stripAmpSubdomain) {
			url = url.replace(/^(amp|wap)\./i, '');
		}

		return url;
	}

	awaitActiveFile(timeout: number = 400): Promise<TFile | null> {
		return new Promise((resolve) => {
			const checkActiveFile = () => {
				const file = this.app.workspace.getActiveFile();
				if (file) {
					resolve(file);
				} else {
					setTimeout(checkActiveFile, 50);
				}
			};
			checkActiveFile();
			setTimeout(() => resolve(null), timeout);
		});
	}
}
