import {App, PluginSettingTab, Setting, SettingGroup} from "obsidian";
import Plugin from "./main";

export interface PluginSettings {
	stripWwwSubdomain: boolean;
	stripWwwPlusSubdomain: boolean;
	stripMobileSubdomain: boolean;
	stripAmpSubdomain: boolean;
	formatMetadata: boolean;
}

export const DEFAULT_SETTINGS: PluginSettings = {
	stripWwwSubdomain: true,
	stripWwwPlusSubdomain: true,
	stripMobileSubdomain: true,
	stripAmpSubdomain: true,
	formatMetadata: false,
}

export class MainSettingTab extends PluginSettingTab {
	plugin: Plugin;

	constructor(app: App, plugin: Plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new SettingGroup(containerEl)
			.setHeading('Hide protocol')
			.addSetting(setting => setting
				.setName(this.format('<kbd>https:</kbd>'))
				.setDesc('Always enabled')
				.addToggle(toggle => (toggle)
					.setDisabled(true)
					.setValue(true)))

		new SettingGroup(containerEl)
			.setHeading('Hide subdomains')
			.addSetting(setting => setting
				.setName(this.format('<kbd>www.</kbd>'))
				.addToggle(toggle => (toggle)
					.setValue(this.plugin.settings.stripWwwSubdomain)
					.onChange(async (value) => {
						this.plugin.settings.stripWwwSubdomain = value;
						await this.plugin.saveSettings();
					})))
			.addSetting(setting => setting
				.setName(this.format('<kbd>www1.</kbd> + <kbd>www2.</kbd>'))
				.addToggle(text => (text)
					.setValue(this.plugin.settings.stripWwwPlusSubdomain)
					.onChange(async (value) => {
						this.plugin.settings.stripWwwPlusSubdomain = value;
						await this.plugin.saveSettings();
					})))
			.addSetting(setting => setting
				.setName(this.format('<kbd>m.</kbd> + <kbd>mobile.</kbd>'))
				.addToggle(text => (text)
					.setValue(this.plugin.settings.stripMobileSubdomain)
					.onChange(async (value) => {
						this.plugin.settings.stripMobileSubdomain = value;
						await this.plugin.saveSettings();
					})))
			.addSetting(setting => setting
				.setName(this.format('<kbd>amp.</kbd> + <kbd>wap.</kbd>'))
				.addToggle(text => (text)
					.setValue(this.plugin.settings.stripAmpSubdomain)
					.onChange(async (value) => {
						this.plugin.settings.stripAmpSubdomain = value;
						await this.plugin.saveSettings();
					})))

		new SettingGroup(containerEl)
			.setHeading('Properties')
			.addSetting(setting => setting
				.setName(this.format('Format links in note properties'))
				.addToggle(text => (text)
					.setValue(this.plugin.settings.formatMetadata)
					.onChange(async (value) => {
						this.plugin.settings.formatMetadata = value;
						await this.plugin.saveSettings();
					})))
	}

	format(html: string): DocumentFragment {
		return document.createRange().createContextualFragment(html);
	}
}
