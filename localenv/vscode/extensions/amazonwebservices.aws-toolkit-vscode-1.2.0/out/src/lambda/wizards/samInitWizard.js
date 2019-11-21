"use strict";
/*!
 * Copyright 2018-2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const nls = require("vscode-nls");
const localize = nls.loadMessageBundle();
const os = require("os");
const path = require("path");
const vscode = require("vscode");
const constants_1 = require("../../shared/constants");
const buttons_1 = require("../../shared/ui/buttons");
const input = require("../../shared/ui/input");
const picker = require("../../shared/ui/picker");
const lambdaRuntime = require("../models/samLambdaRuntime");
const multiStepWizard_1 = require("../wizards/multiStepWizard");
class DefaultCreateNewSamAppWizardContext {
    constructor() {
        this.lambdaRuntimes = lambdaRuntime.samLambdaRuntimes;
        this.showOpenDialog = vscode.window.showOpenDialog;
        this.helpButton = buttons_1.createHelpButton(localize('AWS.command.help', 'View Documentation'));
    }
    get workspaceFolders() {
        return vscode.workspace.workspaceFolders;
    }
    promptUserForRuntime(currRuntime) {
        return __awaiter(this, void 0, void 0, function* () {
            const quickPick = picker.createQuickPick({
                options: {
                    ignoreFocusOut: true,
                    title: localize('AWS.samcli.initWizard.runtime.prompt', 'Select a SAM Application Runtime'),
                    value: currRuntime ? currRuntime : ''
                },
                buttons: [this.helpButton, vscode.QuickInputButtons.Back],
                items: this.lambdaRuntimes
                    .toArray()
                    .sort(lambdaRuntime.compareSamLambdaRuntime)
                    .map(runtime => ({
                    label: runtime,
                    alwaysShow: runtime === currRuntime,
                    description: runtime === currRuntime
                        ? localize('AWS.samcli.wizard.selectedPreviously', 'Selected Previously')
                        : ''
                }))
            });
            const choices = yield picker.promptUser({
                picker: quickPick,
                onDidTriggerButton: (button, resolve, reject) => {
                    if (button === vscode.QuickInputButtons.Back) {
                        resolve(undefined);
                    }
                    else if (button === this.helpButton) {
                        vscode.env.openExternal(vscode.Uri.parse(constants_1.samInitDocUrl));
                    }
                }
            });
            const val = picker.verifySinglePickerOutput(choices);
            return val ? val.label : undefined;
        });
    }
    promptUserForLocation() {
        return __awaiter(this, void 0, void 0, function* () {
            const items = (this.workspaceFolders || [])
                .map(f => new WorkspaceFolderQuickPickItem(f))
                .concat([new BrowseFolderQuickPickItem(this)]);
            const quickPick = picker.createQuickPick({
                options: {
                    ignoreFocusOut: true,
                    title: localize('AWS.samcli.initWizard.location.prompt', 'Select a workspace folder for your new project')
                },
                items: items,
                buttons: [this.helpButton, vscode.QuickInputButtons.Back]
            });
            const choices = yield picker.promptUser({
                picker: quickPick,
                onDidTriggerButton: (button, resolve, reject) => {
                    if (button === vscode.QuickInputButtons.Back) {
                        resolve(undefined);
                    }
                    else if (button === this.helpButton) {
                        vscode.env.openExternal(vscode.Uri.parse(constants_1.samInitDocUrl));
                    }
                }
            });
            const pickerResponse = picker.verifySinglePickerOutput(choices);
            if (!pickerResponse) {
                return undefined;
            }
            if (pickerResponse instanceof BrowseFolderQuickPickItem) {
                const browseFolderResult = yield pickerResponse.getUri();
                // If user cancels from Open Folder dialog, send them back to the folder picker.
                return browseFolderResult ? browseFolderResult : this.promptUserForLocation();
            }
            return pickerResponse.getUri();
        });
    }
    promptUserForName() {
        return __awaiter(this, void 0, void 0, function* () {
            const inputBox = input.createInputBox({
                options: {
                    title: localize('AWS.samcli.initWizard.name.prompt', 'Enter a name for your new application'),
                    ignoreFocusOut: true
                },
                buttons: [this.helpButton, vscode.QuickInputButtons.Back]
            });
            return yield input.promptUser({
                inputBox: inputBox,
                onValidateInput: (value) => {
                    if (!value) {
                        return localize('AWS.samcli.initWizard.name.error.empty', 'Application name cannot be empty');
                    }
                    if (value.includes(path.sep)) {
                        return localize('AWS.samcli.initWizard.name.error.pathSep', 'The path separator ({0}) is not allowed in application names', path.sep);
                    }
                    return undefined;
                },
                onDidTriggerButton: (button, resolve, reject) => {
                    if (button === vscode.QuickInputButtons.Back) {
                        resolve(undefined);
                    }
                    else if (button === this.helpButton) {
                        vscode.env.openExternal(vscode.Uri.parse(constants_1.samInitDocUrl));
                    }
                }
            });
        });
    }
}
exports.DefaultCreateNewSamAppWizardContext = DefaultCreateNewSamAppWizardContext;
class CreateNewSamAppWizard extends multiStepWizard_1.MultiStepWizard {
    constructor(context) {
        super();
        this.context = context;
        this.RUNTIME = () => __awaiter(this, void 0, void 0, function* () {
            this.runtime = yield this.context.promptUserForRuntime(this.runtime);
            return this.runtime ? this.LOCATION : undefined;
        });
        this.LOCATION = () => __awaiter(this, void 0, void 0, function* () {
            this.location = yield this.context.promptUserForLocation();
            return this.location ? this.NAME : this.RUNTIME;
        });
        this.NAME = () => __awaiter(this, void 0, void 0, function* () {
            this.name = yield this.context.promptUserForName();
            return this.name ? undefined : this.LOCATION;
        });
    }
    get startStep() {
        return this.RUNTIME;
    }
    getResult() {
        if (!this.runtime || !this.location || !this.name) {
            return undefined;
        }
        return {
            runtime: this.runtime,
            location: this.location,
            name: this.name
        };
    }
}
exports.CreateNewSamAppWizard = CreateNewSamAppWizard;
class WorkspaceFolderQuickPickItem {
    constructor(folder) {
        this.folder = folder;
        this.label = folder.name;
    }
    getUri() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.folder.uri;
        });
    }
}
class BrowseFolderQuickPickItem {
    constructor(context) {
        this.context = context;
        this.alwaysShow = true;
    }
    get label() {
        if (this.context.workspaceFolders && this.context.workspaceFolders.length > 0) {
            return localize('AWS.samcli.initWizard.location.select.folder', 'Select a different folder...');
        }
        return localize('AWS.samcli.initWizard.location.select.folder.empty.workspace', 'There are no workspace folders open. Select a folder...');
    }
    get detail() {
        return localize('AWS.samcli.initWizard.location.select.folder.detail', 'The folder you select will be added to your VS Code workspace.');
    }
    getUri() {
        return __awaiter(this, void 0, void 0, function* () {
            const workspaceFolders = this.context.workspaceFolders;
            const defaultUri = !!workspaceFolders && workspaceFolders.length > 0 ? workspaceFolders[0].uri : vscode.Uri.file(os.homedir());
            const result = yield this.context.showOpenDialog({
                defaultUri,
                openLabel: localize('AWS.samcli.initWizard.name.browse.openLabel', 'Open'),
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false
            });
            if (!result || !result.length) {
                return undefined;
            }
            return result[0];
        });
    }
}
//# sourceMappingURL=samInitWizard.js.map