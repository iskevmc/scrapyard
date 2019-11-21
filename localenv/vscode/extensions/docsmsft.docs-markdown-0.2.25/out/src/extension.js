"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* The module 'vscode' contains the VS Code extensibility API
 The LoadToolbar function will populate items in the toolbar, but only when the extension loads the first time.
 The common file provides functions that are useful across all commands.
 Logging, Error Handling, VS Code window updates, etc.
*/
const vscode_1 = require("vscode");
const alert_controller_1 = require("./controllers/alert-controller");
const bold_controller_1 = require("./controllers/bold-controller");
const cleanup_controller_1 = require("./controllers/cleanup-controller");
const code_controller_1 = require("./controllers/code-controller");
const image_controller_1 = require("./controllers/image-controller");
const include_controller_1 = require("./controllers/include-controller");
const italic_controller_1 = require("./controllers/italic-controller");
const lint_config_controller_1 = require("./controllers/lint-config-controller");
const list_controller_1 = require("./controllers/list-controller");
const master_redirect_controller_1 = require("./controllers/master-redirect-controller");
const media_controller_1 = require("./controllers/media-controller");
const no_loc_controller_1 = require("./controllers/no-loc-controller");
const preview_controller_1 = require("./controllers/preview-controller");
const quick_pick_menu_controller_1 = require("./controllers/quick-pick-menu-controller");
const row_columns_controller_1 = require("./controllers/row-columns-controller");
const snippet_controller_1 = require("./controllers/snippet-controller");
const table_controller_1 = require("./controllers/table-controller");
const xref_controller_1 = require("./controllers/xref-controller");
const yaml_controller_1 = require("./controllers/yaml-controller");
const common_1 = require("./helper/common");
const telemetry_1 = require("./helper/telemetry");
const ui_1 = require("./helper/ui");
const yaml_metadata_1 = require("./helper/yaml-metadata");
exports.output = vscode_1.window.createOutputChannel("docs-markdown");
/**
 * Provides the commands to the extension. This method is called when extension is activated.
 * Extension is activated the very first time the command is executed.
 * preview commands -
 * formatting commands -
 *
 * param {vscode.ExtensionContext} the context the extension runs in, provided by vscode on activation of the extension.
 */
function activate(context) {
    exports.extensionPath = context.extensionPath;
    context.subscriptions.push(new telemetry_1.Reporter(context));
    const { msTimeValue } = common_1.generateTimestamp();
    exports.output.appendLine(`[${msTimeValue}] - Activating docs markdown extension.`);
    // Places "Docs Markdown Authoring" into the Toolbar
    new ui_1.UiHelper().LoadToolbar();
    // check for docs extensions
    installedExtensionsCheck();
    // Markdownlint custom rule check
    checkMarkdownlintCustomProperty();
    // Update markdownlint.config to fix MD025 issue
    lint_config_controller_1.addFrontMatterTitle();
    // Creates an array of commands from each command file.
    const AuthoringCommands = [];
    alert_controller_1.insertAlertCommand().forEach((cmd) => AuthoringCommands.push(cmd));
    include_controller_1.insertIncludeCommand().forEach((cmd) => AuthoringCommands.push(cmd));
    media_controller_1.insertLinksAndMediaCommands().forEach((cmd) => AuthoringCommands.push(cmd));
    list_controller_1.insertListsCommands().forEach((cmd) => AuthoringCommands.push(cmd));
    snippet_controller_1.insertSnippetCommand().forEach((cmd) => AuthoringCommands.push(cmd));
    table_controller_1.insertTableCommand().forEach((cmd) => AuthoringCommands.push(cmd));
    bold_controller_1.boldFormattingCommand().forEach((cmd) => AuthoringCommands.push(cmd));
    code_controller_1.codeFormattingCommand().forEach((cmd) => AuthoringCommands.push(cmd));
    italic_controller_1.italicFormattingCommand().forEach((cmd) => AuthoringCommands.push(cmd));
    quick_pick_menu_controller_1.quickPickMenuCommand().forEach((cmd) => AuthoringCommands.push(cmd));
    preview_controller_1.previewTopicCommand().forEach((cmd) => AuthoringCommands.push(cmd));
    master_redirect_controller_1.getMasterRedirectionCommand().forEach((cmd) => AuthoringCommands.push(cmd));
    cleanup_controller_1.applyCleanupCommand().forEach((cmd) => AuthoringCommands.push(cmd));
    xref_controller_1.applyXrefCommand().forEach((cmd) => AuthoringCommands.push(cmd));
    yaml_controller_1.yamlCommands().forEach((cmd) => AuthoringCommands.push(cmd));
    no_loc_controller_1.noLocTextCommand().forEach((cmd) => AuthoringCommands.push(cmd));
    row_columns_controller_1.insertRowsAndColumnsCommand().forEach((cmd) => AuthoringCommands.push(cmd));
    image_controller_1.insertImageCommand().forEach((cmd) => AuthoringCommands.push(cmd));
    // Autocomplete
    context.subscriptions.push(setupAutoComplete());
    // Telemetry
    context.subscriptions.push(new telemetry_1.Reporter(context));
    // Attempts the registration of commands with VS Code and then add them to the extension context.
    try {
        AuthoringCommands.map((cmd) => {
            const commandName = cmd.command;
            const command = vscode_1.commands.registerCommand(commandName, cmd.callback);
            context.subscriptions.push(command);
        });
    }
    catch (error) {
        exports.output.appendLine(`[${msTimeValue}] - Error registering commands with vscode extension context: + ${error}`);
    }
    exports.output.appendLine(`[${msTimeValue}] - Registered commands with vscode extension context.`);
    // if the user changes markdown.showToolbar in settings.json, display message telling them to reload.
    vscode_1.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration("markdown.showToolbar")) {
            vscode_1.window.showInformationMessage("Your updated configuration has been recorded, but you must reload to see its effects.", "Reload")
                .then((res) => {
                if (res === "Reload") {
                    vscode_1.commands.executeCommand("workbench.action.reloadWindow");
                }
            });
        }
    });
}
exports.activate = activate;
function installedExtensionsCheck() {
    const { msTimeValue } = common_1.generateTimestamp();
    // create a list to house docs extension names, loop through
    const docsExtensions = [
        "docsmsft.docs-article-templates",
        "docsmsft.docs-preview",
    ];
    docsExtensions.forEach((extensionName) => {
        const friendlyName = extensionName.split(".").reverse()[0];
        const inactiveMessage = `[${msTimeValue}] - The ${friendlyName} extension is not installed.`;
        common_1.checkExtension(extensionName, inactiveMessage);
    });
}
exports.installedExtensionsCheck = installedExtensionsCheck;
/**
 * Method to check for the docs custom markdownlint value.
 * Checks for markdownlint.customRules property.  If markdownlint isn't installed, do nothing.  If markdownlint is installed, check for custom property values.
 */
function checkMarkdownlintCustomProperty() {
    const { msTimeValue } = common_1.generateTimestamp();
    const customProperty = "markdownlint.customRules";
    const customRuleset = "{docsmsft.docs-markdown}/markdownlint-custom-rules/rules.js";
    const customPropertyData = vscode_1.workspace.getConfiguration().inspect(customProperty);
    // new list for string comparison and updating.
    const existingUserSettings = [];
    if (customPropertyData) {
        // if the markdownlint.customRules property exists, pull the global values (user settings) into a string.
        if (customPropertyData.globalValue) {
            const valuesToString = customPropertyData.globalValue.toString();
            const individualValues = valuesToString.split(",");
            individualValues.forEach((setting) => {
                existingUserSettings.push(setting);
            });
            // if the customRuleset already exist, write a notification to the output window and continue.
            if (existingUserSettings.indexOf(customRuleset) > -1) {
                exports.output.appendLine(`[${msTimeValue}] - Docs custom markdownlint ruleset is already set at a global level.`);
            }
            else {
                // if the customRuleset does not exists, append it to the other values in the list if there are any or add it as the only value.
                existingUserSettings.push(customRuleset);
                // update the user settings with new/updated values and notify user.
                // if a user has specific workspace settings for customRules, vscode will use those. this is done so we don't override non-docs repos.
                vscode_1.workspace.getConfiguration().update(customProperty, existingUserSettings, vscode_1.ConfigurationTarget.Global);
                exports.output.appendLine(`[${msTimeValue}] - Docs custom markdownlint ruleset added to user settings.`);
            }
        }
        // if no custom rules exist, create array and add docs custom ruleset.
        if (customPropertyData.globalValue === undefined) {
            const customPropertyValue = [customRuleset];
            vscode_1.workspace.getConfiguration().update(customProperty, customPropertyValue, vscode_1.ConfigurationTarget.Global);
            exports.output.appendLine(`[${msTimeValue}] - Docs custom markdownlint ruleset added to user settings.`);
        }
    }
}
exports.checkMarkdownlintCustomProperty = checkMarkdownlintCustomProperty;
function setupAutoComplete() {
    let completionItemsMarkdownYamlHeader = [];
    completionItemsMarkdownYamlHeader = completionItemsMarkdownYamlHeader.concat(no_loc_controller_1.noLocCompletionItemsMarkdownYamlHeader());
    let completionItemsMarkdown = [];
    completionItemsMarkdown = completionItemsMarkdown.concat(no_loc_controller_1.noLocCompletionItemsMarkdown());
    let completionItemsYaml = [];
    completionItemsYaml = completionItemsYaml.concat(no_loc_controller_1.noLocCompletionItemsYaml());
    return vscode_1.languages.registerCompletionItemProvider("*", {
        provideCompletionItems(document) {
            const editor = vscode_1.window.activeTextEditor;
            if (!editor) {
                common_1.noActiveEditorMessage();
                return;
            }
            if (document.languageId === "markdown") {
                if (yaml_metadata_1.isCursorInsideYamlHeader(editor)) {
                    return completionItemsMarkdownYamlHeader;
                }
                else {
                    return completionItemsMarkdown;
                }
            }
            else {
                return completionItemsYaml;
            }
        },
    });
}
// this method is called when your extension is deactivated
function deactivate() {
    exports.output.appendLine("Deactivating extension.");
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map