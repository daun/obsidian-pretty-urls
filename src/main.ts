import {Plugin as BasePlugin, TFile} from "obsidian";

import {DEFAULT_SETTINGS, PluginSettings, MainSettingTab} from "./settings";
import {prettyUrl, isExternalUrl} from "./formatter";

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

	processMetadataLinks() {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) return;

		const selector = `.metadata-property-value ${this.frontmatterLinkSelector}`;
		Array.from(document.querySelectorAll(selector))
			.filter((node) => this.isUrlOnlyMetadataLink(node))
			.forEach((link) => this.formatMetadataLink(link));
	}

	isUrlOnlyLink(node: Node): node is HTMLAnchorElement {
		return node instanceof HTMLAnchorElement
			&& isExternalUrl(node.href)
			&& node.href === node.textContent
			&& node.childElementCount === 0;
	}

	formatLink(node: HTMLAnchorElement): void {
		node.textContent = prettyUrl(node.href, this.settings);
	}

	isUrlOnlyMetadataLink(node: Node): node is HTMLDivElement {
		return node instanceof HTMLDivElement
			&& node.dataset.href !== undefined
			&& isExternalUrl(node.dataset.href)
			&& node.dataset.href === node.textContent
			&& node.childElementCount === 0;
	}

	formatMetadataLink(node: HTMLDivElement): void {
		node.textContent = prettyUrl(node.dataset.href!, this.settings);
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
