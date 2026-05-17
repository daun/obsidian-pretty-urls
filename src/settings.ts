import {App, PluginSettingTab, Setting, SettingGroup, sanitizeHTMLToDom} from "obsidian";
import Plugin from "./main";
import {LabelRule, DEFAULT_LABEL_RULES, compileRule, looksExpensive} from "./labels";

export interface PluginSettings {
	stripWwwSubdomain: boolean;
	stripWwwPlusSubdomain: boolean;
	stripMobileSubdomain: boolean;
	stripAmpSubdomain: boolean;
	formatMetadata: boolean;
	labelRules: LabelRule[];
}

export const DEFAULT_SETTINGS: PluginSettings = {
	stripWwwSubdomain: true,
	stripWwwPlusSubdomain: true,
	stripMobileSubdomain: true,
	stripAmpSubdomain: true,
	formatMetadata: false,
	labelRules: DEFAULT_LABEL_RULES,
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
			.addSetting((setting) => { setting
				.setName(this.format('<kbd>https:</kbd>'))
				.setDesc('Always enabled')
				.addToggle(toggle => (toggle)
					.setDisabled(true)
					.setValue(true))
			})

		new SettingGroup(containerEl)
			.setHeading('Hide subdomains')
			.addSetting((setting) => { setting
				.setName(this.format('<kbd>www.</kbd>'))
				.addToggle(toggle => (toggle)
					.setValue(this.plugin.settings.stripWwwSubdomain)
					.onChange(async (value) => {
						this.plugin.settings.stripWwwSubdomain = value;
						await this.plugin.saveSettings();
					}))
			})
			.addSetting((setting) => { setting
				.setName(this.format('<kbd>www1.</kbd> + <kbd>www2.</kbd>'))
				.addToggle(text => (text)
					.setValue(this.plugin.settings.stripWwwPlusSubdomain)
					.onChange(async (value) => {
						this.plugin.settings.stripWwwPlusSubdomain = value;
						await this.plugin.saveSettings();
					}))
			})
			.addSetting((setting) => { setting
				.setName(this.format('<kbd>m.</kbd> + <kbd>mobile.</kbd>'))
				.addToggle(text => (text)
					.setValue(this.plugin.settings.stripMobileSubdomain)
					.onChange(async (value) => {
						this.plugin.settings.stripMobileSubdomain = value;
						await this.plugin.saveSettings();
					}))
			})
			.addSetting((setting) => { setting
				.setName(this.format('<kbd>amp.</kbd> + <kbd>wap.</kbd>'))
				.addToggle(text => (text)
					.setValue(this.plugin.settings.stripAmpSubdomain)
					.onChange(async (value) => {
						this.plugin.settings.stripAmpSubdomain = value;
						await this.plugin.saveSettings();
					}))
			})

		new SettingGroup(containerEl)
			.setHeading('Properties')
			.addSetting((setting) => { setting
				.setName(this.format('Format links in note properties'))
				.addToggle(text => (text)
					.setValue(this.plugin.settings.formatMetadata)
					.onChange(async (value) => {
						this.plugin.settings.formatMetadata = value;
						await this.plugin.saveSettings();
					}))
			})

		this.displayLabelRules(containerEl);
	}

	displayLabelRules(containerEl: HTMLElement): void {
		const rules = this.plugin.settings.labelRules;
		const group = new SettingGroup(containerEl)
			.setHeading('Custom labels')
			.addSetting((setting) => {
				setting.setDesc('Define regex rules to reformat the visible label of links. Rules are applied in order: the first matching rule wins.');
			});

		for (let i = 0; i < rules.length; i++) {
			const rule = rules[i];
			if (!rule) continue;
			group.addSetting((setting) => {
				setting.infoEl?.addClass('pretty-urls-rule-info');
				setting
					.setName(`#${i + 1}`)
					.addToggle(toggle => {
						toggle
							.setValue(rule.enabled)
							.setTooltip('Enable rule')
							.onChange(async (value) => {
								rule.enabled = value;
								await this.plugin.saveSettings();
							});
					})
					.addText(text => {
						text
							.setPlaceholder('Pattern (regex)')
							.setValue(rule.pattern)
							.onChange(async (value) => {
								rule.pattern = value;
								await this.plugin.saveSettings();
								validatePattern(setting, value);
							});
						text.inputEl.setAttribute('autocapitalize', 'off');
						text.inputEl.setAttribute('autocorrect', 'off');
						text.inputEl.setAttribute('spellcheck', 'false');
						text.inputEl.addClass('pretty-urls-input', 'pretty-urls-pattern-input');
					})
					.addText(text => {
						text
							.setPlaceholder('Replacement ($1, $2, …)')
							.setValue(rule.replacement)
							.onChange(async (value) => {
								rule.replacement = value;
								await this.plugin.saveSettings();
							});
						text.inputEl.setAttribute('autocapitalize', 'off');
						text.inputEl.setAttribute('autocorrect', 'off');
						text.inputEl.setAttribute('spellcheck', 'false');
						text.inputEl.addClass('pretty-urls-input', 'pretty-urls-replacement-input');
					})
					.addExtraButton(button => {
						button
							.setIcon('chevron-up')
							.setTooltip('Move up')
							.setDisabled(i === 0)
							.onClick(async () => {
								if (i === 0) return;
								swapRules(rules, i - 1, i);
								await this.plugin.saveSettings();
								this.display();
							});
					})
					.addExtraButton(button => {
						button
							.setIcon('chevron-down')
							.setTooltip('Move down')
							.setDisabled(i === rules.length - 1)
							.onClick(async () => {
								if (i === rules.length - 1) return;
								swapRules(rules, i, i + 1);
								await this.plugin.saveSettings();
								this.display();
							});
					})
					.addExtraButton(button => {
						button
							.setIcon('trash')
							.setTooltip('Delete rule')
							.onClick(async () => {
								rules.splice(i, 1);
								await this.plugin.saveSettings();
								this.display();
							});
					});

				// Apply initial validation state
				validatePattern(setting, rule.pattern);
			});
		}

		// "Add rule" button
		group.addSetting((setting) => {
			setting
				.addButton(button => {
					button
						.setButtonText('Add rule')
						.setCta()
						.onClick(async () => {
							rules.push({
								id: crypto.randomUUID(),
								pattern: '',
								replacement: '',
								enabled: true,
							});
							await this.plugin.saveSettings();
							this.display();
						});
				});
		});
	}

	format(html: string): DocumentFragment {
		return sanitizeHTMLToDom(html);
	}
}

function swapRules(rules: LabelRule[], a: number, b: number): void {
	const tmp = rules[a];
	if (tmp === undefined) return;
	const next = rules[b];
	if (next === undefined) return;
	rules[a] = next;
	rules[b] = tmp;
}

function validatePattern(setting: Setting, pattern: string): void {
	if (!pattern) {
		setting.settingEl.removeClass('mod-warning');
		setting.setDesc('');
		return;
	}
	try {
		compileRule(pattern);
		const re = compileRule(pattern);
		if (re === null) throw new Error('Invalid pattern');
		if (looksExpensive(pattern)) {
			setting.settingEl.addClass('mod-warning');
			setting.setDesc('This pattern may cause slow performance on long urls');
		} else {
			setting.settingEl.removeClass('mod-warning');
			setting.setDesc('');
		}
	} catch (e) {
		setting.settingEl.addClass('mod-warning');
		setting.setDesc(`Invalid pattern: ${(e as Error).message}`);
	}
}
