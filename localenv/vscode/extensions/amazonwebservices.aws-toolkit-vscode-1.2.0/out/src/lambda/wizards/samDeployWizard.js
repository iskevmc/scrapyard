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
const path = require("path");
const vscode = require("vscode");
const constants_1 = require("../../shared/constants");
const logger_1 = require("../../shared/logger");
const buttons_1 = require("../../shared/ui/buttons");
const input = require("../../shared/ui/input");
const picker = require("../../shared/ui/picker");
const collectionUtils_1 = require("../../shared/utilities/collectionUtils");
const configureParameterOverrides_1 = require("../config/configureParameterOverrides");
const detectLocalTemplates_1 = require("../local/detectLocalTemplates");
const parameterUtils_1 = require("../utilities/parameterUtils");
const multiStepWizard_1 = require("./multiStepWizard");
function getSingleResponse(responses) {
    if (!responses) {
        return undefined;
    }
    if (responses.length !== 1) {
        throw new Error(`Expected a single response, but got ${responses.length}`);
    }
    return responses[0].label;
}
class DefaultSamDeployWizardContext {
    constructor() {
        this.onDetectLocalTemplates = detectLocalTemplates_1.detectLocalTemplates;
        this.getParameters = parameterUtils_1.getParameters;
        this.getOverriddenParameters = parameterUtils_1.getOverriddenParameters;
        this.helpButton = buttons_1.createHelpButton(localize('AWS.command.help', 'View Documentation'));
    }
    get workspaceFolders() {
        return (vscode.workspace.workspaceFolders || []).map(f => f.uri);
    }
    /**
     * Retrieves the URI of a Sam template to deploy from the user
     *
     * @returns vscode.Uri of a Sam Template. undefined represents cancel.
     */
    promptUserForSamTemplate(initialValue) {
        return __awaiter(this, void 0, void 0, function* () {
            const workspaceFolders = this.workspaceFolders || [];
            const quickPick = picker.createQuickPick({
                options: {
                    ignoreFocusOut: true,
                    title: localize('AWS.samcli.deploy.template.prompt', 'Which SAM Template would you like to deploy to AWS?')
                },
                buttons: [this.helpButton, vscode.QuickInputButtons.Back],
                items: yield getTemplateChoices(this.onDetectLocalTemplates, ...workspaceFolders)
            });
            const choices = yield picker.promptUser({
                picker: quickPick,
                onDidTriggerButton: (button, resolve, reject) => {
                    if (button === vscode.QuickInputButtons.Back) {
                        resolve(undefined);
                    }
                    else if (button === this.helpButton) {
                        vscode.env.openExternal(vscode.Uri.parse(constants_1.samDeployDocUrl));
                    }
                }
            });
            const val = picker.verifySinglePickerOutput(choices);
            return val ? val.uri : undefined;
        });
    }
    promptUserForParametersIfApplicable({ templateUri, missingParameters = new Set() }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (missingParameters.size < 1) {
                const prompt = localize('AWS.samcli.deploy.parameters.optionalPrompt.message', 'The template {0} contains parameters. ' +
                    'Would you like to override the default values for these parameters?', templateUri.fsPath);
                const responseYes = localize('AWS.samcli.deploy.parameters.optionalPrompt.responseYes', 'Yes');
                const responseNo = localize('AWS.samcli.deploy.parameters.optionalPrompt.responseNo', 'No');
                const quickPick = picker.createQuickPick({
                    options: {
                        ignoreFocusOut: true,
                        title: prompt
                    },
                    buttons: [this.helpButton, vscode.QuickInputButtons.Back],
                    items: [{ label: responseYes }, { label: responseNo }]
                });
                const response = getSingleResponse(yield picker.promptUser({
                    picker: quickPick,
                    onDidTriggerButton: (button, resolve, reject) => {
                        if (button === vscode.QuickInputButtons.Back) {
                            resolve(undefined);
                        }
                        else if (button === this.helpButton) {
                            vscode.env.openExternal(vscode.Uri.parse(constants_1.samDeployDocUrl));
                        }
                    }
                }));
                if (response !== responseYes) {
                    return 1 /* Continue */;
                }
                yield configureParameterOverrides_1.configureParameterOverrides({
                    templateUri,
                    requiredParameterNames: missingParameters.keys()
                });
                return 0 /* Cancel */;
            }
            else {
                const prompt = localize('AWS.samcli.deploy.parameters.mandatoryPrompt.message', 'The template {0} contains parameters without default values. ' +
                    'In order to deploy, you must provide values for these parameters. ' +
                    'Configure them now?', templateUri.fsPath);
                const responseConfigure = localize('AWS.samcli.deploy.parameters.mandatoryPrompt.responseConfigure', 'Configure');
                const responseCancel = localize('AWS.samcli.deploy.parameters.mandatoryPrompt.responseCancel', 'Cancel');
                const quickPick = picker.createQuickPick({
                    options: {
                        ignoreFocusOut: true,
                        title: prompt
                    },
                    buttons: [this.helpButton, vscode.QuickInputButtons.Back],
                    items: [{ label: responseConfigure }, { label: responseCancel }]
                });
                const response = getSingleResponse(yield picker.promptUser({
                    picker: quickPick,
                    onDidTriggerButton: (button, resolve, reject) => {
                        if (button === vscode.QuickInputButtons.Back) {
                            resolve(undefined);
                        }
                        else if (button === this.helpButton) {
                            vscode.env.openExternal(vscode.Uri.parse(constants_1.samDeployDocUrl));
                        }
                    }
                }));
                if (response === responseConfigure) {
                    yield configureParameterOverrides_1.configureParameterOverrides({
                        templateUri,
                        requiredParameterNames: missingParameters.keys()
                    });
                }
                return 0 /* Cancel */;
            }
        });
    }
    promptUserForRegion(regionProvider, initialRegionCode) {
        return __awaiter(this, void 0, void 0, function* () {
            const regionData = yield regionProvider.getRegionData();
            const quickPick = picker.createQuickPick({
                options: {
                    title: localize('AWS.samcli.deploy.region.prompt', 'Which AWS Region would you like to deploy to?'),
                    value: initialRegionCode || '',
                    matchOnDetail: true,
                    ignoreFocusOut: true
                },
                items: regionData.map(r => ({
                    label: r.regionName,
                    detail: r.regionCode,
                    // this is the only way to get this to show on going back
                    // this will make it so it always shows even when searching for something else
                    alwaysShow: r.regionCode === initialRegionCode,
                    description: r.regionCode === initialRegionCode
                        ? localize('AWS.samcli.wizard.selectedPreviously', 'Selected Previously')
                        : ''
                })),
                buttons: [this.helpButton, vscode.QuickInputButtons.Back]
            });
            const choices = yield picker.promptUser({
                picker: quickPick,
                onDidTriggerButton: (button, resolve, reject) => {
                    if (button === vscode.QuickInputButtons.Back) {
                        resolve(undefined);
                    }
                    else if (button === this.helpButton) {
                        vscode.env.openExternal(vscode.Uri.parse(constants_1.samDeployDocUrl));
                    }
                }
            });
            const val = picker.verifySinglePickerOutput(choices);
            return val ? val.detail : undefined;
        });
    }
    /**
     * Retrieves an S3 Bucket to deploy to from the user.
     *
     * @param initialValue Optional, Initial value to prompt with
     *
     * @returns S3 Bucket name. Undefined represents cancel.
     */
    promptUserForS3Bucket(selectedRegion, initialValue) {
        return __awaiter(this, void 0, void 0, function* () {
            const inputBox = input.createInputBox({
                buttons: [this.helpButton, vscode.QuickInputButtons.Back],
                options: {
                    title: localize('AWS.samcli.deploy.s3Bucket.prompt', 'Enter the AWS S3 bucket to which your code should be deployed'),
                    ignoreFocusOut: true,
                    prompt: localize('AWS.samcli.deploy.s3Bucket.region', 'S3 bucket must be in selected region: {0}', selectedRegion)
                }
            });
            // Pre-populate the value if it was already set
            if (initialValue) {
                inputBox.value = initialValue;
            }
            return yield input.promptUser({
                inputBox: inputBox,
                onValidateInput: validateS3Bucket,
                onDidTriggerButton: (button, resolve, reject) => {
                    if (button === vscode.QuickInputButtons.Back) {
                        resolve(undefined);
                    }
                    else if (button === this.helpButton) {
                        vscode.env.openExternal(vscode.Uri.parse(constants_1.samDeployDocUrl));
                    }
                }
            });
        });
    }
    /**
     * Retrieves a Stack Name to deploy to from the user.
     *
     * @param initialValue Optional, Initial value to prompt with
     * @param validateInput Optional, validates input as it is entered
     *
     * @returns Stack name. Undefined represents cancel.
     */
    promptUserForStackName({ initialValue, validateInput }) {
        return __awaiter(this, void 0, void 0, function* () {
            const inputBox = input.createInputBox({
                buttons: [this.helpButton, vscode.QuickInputButtons.Back],
                options: {
                    title: localize('AWS.samcli.deploy.stackName.prompt', 'Enter the name to use for the deployed stack'),
                    ignoreFocusOut: true
                }
            });
            // Pre-populate the value if it was already set
            if (initialValue) {
                inputBox.value = initialValue;
            }
            return yield input.promptUser({
                inputBox: inputBox,
                onValidateInput: validateInput,
                onDidTriggerButton: (button, resolve, reject) => {
                    if (button === vscode.QuickInputButtons.Back) {
                        resolve(undefined);
                    }
                    else if (button === this.helpButton) {
                        vscode.env.openExternal(vscode.Uri.parse(constants_1.samDeployDocUrl));
                    }
                }
            });
        });
    }
}
exports.DefaultSamDeployWizardContext = DefaultSamDeployWizardContext;
class SamDeployWizard extends multiStepWizard_1.MultiStepWizard {
    constructor(regionProvider, context) {
        super();
        this.regionProvider = regionProvider;
        this.context = context;
        this.response = {};
        this.TEMPLATE = () => __awaiter(this, void 0, void 0, function* () {
            this.response.template = yield this.context.promptUserForSamTemplate(this.response.template);
            return this.response.template ? this.PARAMETER_OVERRIDES : undefined;
        });
        this.PARAMETER_OVERRIDES = () => __awaiter(this, void 0, void 0, function* () {
            const getNextStep = (result) => {
                switch (result) {
                    case 0 /* Cancel */:
                        return undefined;
                    case 1 /* Continue */:
                        return this.REGION;
                }
            };
            if (!this.response.template) {
                throw new Error('Unexpected state: TEMPLATE step is complete, but no template was selected');
            }
            const parameters = yield this.context.getParameters(this.response.template);
            if (parameters.size < 1) {
                this.response.parameterOverrides = new Map();
                return this.REGION;
            }
            const requiredParameterNames = new Set(collectionUtils_1.filter(parameters.keys(), name => parameters.get(name).required));
            const overriddenParameters = yield this.context.getOverriddenParameters(this.response.template);
            if (!overriddenParameters) {
                // In there are no missing required parameters case, it isn't mandatory to override any parameters,
                // but we still want to inform users of the option to override. Once we have prompted (i.e., if the
                // parameter overrides section is empty instead of undefined), don't prompt again unless required.
                const options = {
                    templateUri: this.response.template,
                    missingParameters: requiredParameterNames.size > 0 ? requiredParameterNames : undefined
                };
                this.response.parameterOverrides = new Map();
                return getNextStep(yield this.context.promptUserForParametersIfApplicable(options));
            }
            const missingParameters = collectionUtils_1.difference(requiredParameterNames, overriddenParameters.keys());
            if (missingParameters.size > 0) {
                return getNextStep(yield this.context.promptUserForParametersIfApplicable({
                    templateUri: this.response.template,
                    missingParameters
                }));
            }
            this.response.parameterOverrides = overriddenParameters;
            return this.REGION;
        });
        this.REGION = () => __awaiter(this, void 0, void 0, function* () {
            this.response.region = yield this.context.promptUserForRegion(this.regionProvider, this.response.region);
            // The PARAMETER_OVERRIDES step is part of the TEMPLATE step from the user's perspective,
            // so we go back to the TEMPLATE step instead of PARAMETER_OVERRIDES.
            return this.response.region ? this.S3_BUCKET : this.TEMPLATE;
        });
        this.S3_BUCKET = () => __awaiter(this, void 0, void 0, function* () {
            this.response.s3Bucket = yield this.context.promptUserForS3Bucket(this.response.region, this.response.s3Bucket);
            return this.response.s3Bucket ? this.STACK_NAME : this.REGION;
        });
        this.STACK_NAME = () => __awaiter(this, void 0, void 0, function* () {
            this.response.stackName = yield this.context.promptUserForStackName({
                initialValue: this.response.stackName,
                validateInput: validateStackName
            });
            return this.response.stackName ? undefined : this.S3_BUCKET;
        });
    }
    get startStep() {
        return this.TEMPLATE;
    }
    getResult() {
        if (!this.response.parameterOverrides ||
            !this.response.template ||
            !this.response.region ||
            !this.response.s3Bucket ||
            !this.response.stackName) {
            return undefined;
        }
        return {
            parameterOverrides: this.response.parameterOverrides,
            template: this.response.template,
            region: this.response.region,
            s3Bucket: this.response.s3Bucket,
            stackName: this.response.stackName
        };
    }
}
exports.SamDeployWizard = SamDeployWizard;
class SamTemplateQuickPickItem {
    constructor(uri, showWorkspaceFolderDetails) {
        this.uri = uri;
        this.label = SamTemplateQuickPickItem.getLabel(uri);
        if (showWorkspaceFolderDetails) {
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
            if (workspaceFolder) {
                this.description = `in ${workspaceFolder.uri.fsPath}`;
            }
        }
    }
    compareTo(rhs) {
        const labelComp = this.label.localeCompare(rhs.label);
        if (labelComp !== 0) {
            return labelComp;
        }
        const descriptionComp = (this.description || '').localeCompare(rhs.description || '');
        if (descriptionComp !== 0) {
            return descriptionComp;
        }
        return (this.detail || '').localeCompare(rhs.detail || '');
    }
    static getLabel(uri) {
        const logger = logger_1.getLogger();
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        if (workspaceFolder) {
            // If workspace is /usr/foo/code and uri is /usr/foo/code/processor/template.yaml,
            // show "processor/template.yaml"
            return path.relative(workspaceFolder.uri.fsPath, uri.fsPath);
        }
        // We shouldn't find sam templates outside of a workspace folder. If we do, show the full path.
        logger.warn(`Unexpected situation: detected SAM Template ${uri.fsPath} not found within a workspace folder.`);
        return uri.fsPath;
    }
}
// https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-s3-bucket-naming-requirements.html
function validateS3Bucket(value) {
    if (value.length < 3 || value.length > 63) {
        return localize('AWS.samcli.deploy.s3Bucket.error.length', 'S3 bucket name must be between 3 and 63 characters long');
    }
    if (!/^[a-z\d\.\-]+$/.test(value)) {
        return localize('AWS.samcli.deploy.s3Bucket.error.invalidCharacters', 'S3 bucket name may only contain lower-case characters, numbers, periods, and dashes');
    }
    if (/^\d+\.\d+\.\d+\.\d+$/.test(value)) {
        return localize('AWS.samcli.deploy.s3Bucket.error.ipAddress', 'S3 bucket name may not be formatted as an IP address (198.51.100.24)');
    }
    if (value[value.length - 1] === '-') {
        return localize('AWS.samcli.deploy.s3Bucket.error.endsWithDash', 'S3 bucket name may not end with a dash');
    }
    if (value.includes('..')) {
        return localize('AWS.samcli.deploy.s3Bucket.error.consecutivePeriods', 'S3 bucket name may not have consecutive periods');
    }
    if (value.includes('.-') || value.includes('-.')) {
        return localize('AWS.samcli.deploy.s3Bucket.error.dashAdjacentPeriods', 'S3 bucket name may not contain a period adjacent to a dash');
    }
    if (value.split('.').some(label => !/^[a-z\d]/.test(label))) {
        return localize('AWS.samcli.deploy.s3Bucket.error.labelFirstCharacter', 'Each label in an S3 bucket name must begin with a number or a lower-case character');
    }
    return undefined;
}
exports.validateS3Bucket = validateS3Bucket;
// https://docs.aws.amazon.com/AWSCloudFormation/latest/APIReference/API_CreateStack.html
// A stack name can contain only alphanumeric characters (case sensitive) and hyphens.
// It must start with an alphabetic character and cannot be longer than 128 characters.
function validateStackName(value) {
    if (!/^[a-zA-Z\d\-]+$/.test(value)) {
        return localize('AWS.samcli.deploy.stackName.error.invalidCharacters', 'A stack name may contain only alphanumeric characters (case sensitive) and hyphens');
    }
    if (!/^[a-zA-Z]/.test(value)) {
        return localize('AWS.samcli.deploy.stackName.error.firstCharacter', 'A stack name must begin with an alphabetic character');
    }
    if (value.length > 128) {
        return localize('AWS.samcli.deploy.stackName.error.length', 'A stack name must not be longer than 128 characters');
    }
    // TODO: Validate that a stack with this name does not already exist.
    return undefined;
}
function getTemplateChoices(onDetectLocalTemplates = detectLocalTemplates_1.detectLocalTemplates, ...workspaceFolders) {
    return __awaiter(this, void 0, void 0, function* () {
        const uris = yield collectionUtils_1.toArrayAsync(onDetectLocalTemplates({ workspaceUris: workspaceFolders }));
        const uriToLabel = new Map();
        const labelCounts = new Map();
        uris.forEach(uri => {
            const label = SamTemplateQuickPickItem.getLabel(uri);
            uriToLabel.set(uri, label);
            labelCounts.set(label, 1 + (labelCounts.get(label) || 0));
        });
        return Array.from(uriToLabel, ([uri, label]) => {
            const showWorkspaceFolderDetails = (labelCounts.get(label) || 0) > 1;
            return new SamTemplateQuickPickItem(uri, showWorkspaceFolderDetails);
        }).sort((a, b) => a.compareTo(b));
    });
}
//# sourceMappingURL=samDeployWizard.js.map