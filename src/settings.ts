import {App, PluginSettingTab, Setting, SettingGroup, ToggleComponent, sanitizeHTMLToDom, setIcon, setTooltip} from "obsidian";
import Plugin from "./main";
import {LabelRule, DEFAULT_LABEL_RULES, looksExpensive} from "./labels";

export interface PluginSettings {
	stripWwwSubdomain: boolean;
	stripWwwPlusSubdomain: boolean;
	stripMobileSubdomain: boolean;
	stripAmpSubdomain: boolean;
	stripAnchor: boolean;
	formatMetadata: boolean;
	labelRules: LabelRule[];
}

export const DEFAULT_SETTINGS: PluginSettings = {
	stripWwwSubdomain: true,
	stripWwwPlusSubdomain: true,
	stripMobileSubdomain: true,
	stripAmpSubdomain: true,
	stripAnchor: false,
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
			.setHeading('Formatting')
			.addSetting((setting) => { setting
				.setName('Format links in properties panel')
				.addToggle(text => (text)
					.setValue(this.plugin.settings.formatMetadata)
					.onChange(async (value) => {
						this.plugin.settings.formatMetadata = value;
						await this.plugin.saveSettings();
					}))
			})

		new SettingGroup(containerEl)
			.setHeading('Pretty URLs')
			.addSetting((setting) => { setting
				.setName(this.format('Hide protocol → <kbd>https:</kbd>'))
				.addToggle(toggle => (toggle)
					.setDisabled(true)
					.setValue(true))
			})
			.addSetting((setting) => { setting
				.setName(this.format('Hide generic subdomains → <kbd>www.</kbd>'))
				.addToggle(toggle => (toggle)
					.setValue(this.plugin.settings.stripWwwSubdomain)
					.onChange(async (value) => {
						this.plugin.settings.stripWwwSubdomain = value;
						await this.plugin.saveSettings();
					}))
			})
			.addSetting((setting) => { setting
				.setName(this.format('Hide generic subdomains → <kbd>www1.</kbd> / <kbd>www2.</kbd>'))
				.addToggle(text => (text)
					.setValue(this.plugin.settings.stripWwwPlusSubdomain)
					.onChange(async (value) => {
						this.plugin.settings.stripWwwPlusSubdomain = value;
						await this.plugin.saveSettings();
					}))
			})
			.addSetting((setting) => { setting
				.setName(this.format('Hide mobile subdomains → <kbd>m.</kbd> / <kbd>mobile.</kbd>'))
				.addToggle(text => (text)
					.setValue(this.plugin.settings.stripMobileSubdomain)
					.onChange(async (value) => {
						this.plugin.settings.stripMobileSubdomain = value;
						await this.plugin.saveSettings();
					}))
			})
			.addSetting((setting) => { setting
				.setName(this.format('Hide deprecated subdomains → <kbd>amp.</kbd> / <kbd>wap.</kbd>'))
				.addToggle(text => (text)
					.setValue(this.plugin.settings.stripAmpSubdomain)
					.onChange(async (value) => {
						this.plugin.settings.stripAmpSubdomain = value;
						await this.plugin.saveSettings();
					}))
			})
			.addSetting((setting) => { setting
				.setName(this.format('Hide scroll anchors → <kbd>#heading</kbd>'))
				.addToggle(toggle => (toggle)
					.setValue(this.plugin.settings.stripAnchor)
					.onChange(async (value) => {
						this.plugin.settings.stripAnchor = value;
						await this.plugin.saveSettings();
					}))
			})

		this.displayLabelRules(containerEl);
	}

	displayLabelRules(containerEl: HTMLElement): void {
		const rules = this.plugin.settings.labelRules;
		const group = new SettingGroup(containerEl)
			.setHeading('Custom Labels')
			.addSetting((setting) => {
				setting.setDesc('Define regex rules to reformat the visible label of links. The first matching rule wins.');
			});

		for (let i = 0; i < rules.length; i++) {
			const rule = rules[i];
			if (!rule) continue;
			group.addSetting((setting) => {
				let toggleRef!: ToggleComponent;
				let statusEl!: HTMLElement;

				const syncState = async (pattern: string, replacement: string) => {
					const hasContent = pattern.trim() !== '' && replacement.trim() !== '';
					if (!hasContent && rule.enabled) {
						rule.enabled = false;
						toggleRef.setValue(false);
					}
					toggleRef.setDisabled(!hasContent);
					updateStatusIcon(statusEl, pattern);
					await this.plugin.saveSettings();
				};

				setting.infoEl?.addClass('pretty-urls-rule-info');
				setting
					.setName(`#${i + 1}`)
					.addToggle(toggle => {
						toggleRef = toggle;
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
								await syncState(value, rule.replacement);
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
								await syncState(rule.pattern, value);
							});
						text.inputEl.setAttribute('autocapitalize', 'off');
						text.inputEl.setAttribute('autocorrect', 'off');
						text.inputEl.setAttribute('spellcheck', 'false');
						text.inputEl.addClass('pretty-urls-input', 'pretty-urls-replacement-input');
					})
					.then(s => {
						statusEl = s.controlEl.createSpan({ cls: 'pretty-urls-status-icon' });
						const hasContent = rule.pattern.trim() !== '' && rule.replacement.trim() !== '';
						toggleRef.setDisabled(!hasContent);
						updateStatusIcon(statusEl, rule.pattern);
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
								enabled: false,
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

function updateStatusIcon(statusEl: HTMLElement, pattern: string): void {
	statusEl.classList.remove(
		'pretty-urls-status-empty',
		'pretty-urls-status-valid',
		'pretty-urls-status-warning',
		'pretty-urls-status-invalid',
	);

	if (!pattern.trim()) {
		setIcon(statusEl, 'circle-help');
		statusEl.classList.add('pretty-urls-status-empty');
		setTooltip(statusEl, '');
		return;
	}

	try {
		new RegExp(pattern, 'i');
		if (looksExpensive(pattern)) {
			setIcon(statusEl, 'triangle-alert');
			statusEl.classList.add('pretty-urls-status-warning');
			setTooltip(statusEl, 'This pattern may cause slow performance on long urls');
		} else {
			setIcon(statusEl, 'circle-check');
			statusEl.classList.add('pretty-urls-status-valid');
			setTooltip(statusEl, 'Valid regex');
		}
	} catch (e) {
		setIcon(statusEl, 'circle-alert');
		statusEl.classList.add('pretty-urls-status-invalid');
		setTooltip(statusEl, (e as Error).message);
	}
}
