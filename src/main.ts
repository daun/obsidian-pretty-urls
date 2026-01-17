import {Plugin as BasePlugin, TFile} from "obsidian";

import {DEFAULT_SETTINGS, PluginSettings, MainSettingTab} from "./settings";
import {prettyUrl} from "./formatter";
import {LINK_SELECTOR, METADATA_LINK_SELECTOR, isUrlOnlyLink, isUrlOnlyMetadataLink} from "./detector";

export default class Plugin extends BasePlugin {
	settings: PluginSettings;

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
		Array.from(el.querySelectorAll(LINK_SELECTOR))
			.filter(isUrlOnlyLink)
			.forEach((link) => this.formatLink(link));
	}

	processMetadataLinks() {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) return;

		const selector = `.metadata-property-value ${METADATA_LINK_SELECTOR}`;
		Array.from(document.querySelectorAll(selector))
			.filter(isUrlOnlyMetadataLink)
			.forEach((link) => this.formatMetadataLink(link));
	}

	formatLink(node: HTMLAnchorElement): void {
		node.textContent = prettyUrl(node.href, this.settings);
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
