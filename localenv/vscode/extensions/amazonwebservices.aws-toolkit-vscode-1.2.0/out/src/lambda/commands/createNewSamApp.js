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
const activationLaunchPath_1 = require("../../shared/activationLaunchPath");
const filesystemUtilities_1 = require("../../shared/filesystemUtilities");
const samCliContext_1 = require("../../shared/sam/cli/samCliContext");
const samCliInit_1 = require("../../shared/sam/cli/samCliInit");
const samCliValidationUtils_1 = require("../../shared/sam/cli/samCliValidationUtils");
const telemetryTypes_1 = require("../../shared/telemetry/telemetryTypes");
const messages_1 = require("../../shared/utilities/messages");
const workspaceUtils_1 = require("../../shared/utilities/workspaceUtils");
const samLambdaRuntime_1 = require("../models/samLambdaRuntime");
const samInitWizard_1 = require("../wizards/samInitWizard");
function resumeCreateNewSamApp(activationLaunchPath = new activationLaunchPath_1.ActivationLaunchPath()) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pathToLaunch = activationLaunchPath.getLaunchPath();
            if (!pathToLaunch) {
                return;
            }
            const uri = vscode.Uri.file(pathToLaunch);
            if (!vscode.workspace.getWorkspaceFolder(uri)) {
                // This should never happen, as `pathToLaunch` will only be set if `uri` is in
                // the newly added workspace folder.
                vscode.window.showErrorMessage(localize('AWS.samcli.initWizard.source.error.notInWorkspace', "Could not open file '{0}'. If this file exists on disk, try adding it to your workspace.", uri.fsPath));
                return;
            }
            yield vscode.window.showTextDocument(uri);
        }
        finally {
            activationLaunchPath.clearLaunchPath();
        }
    });
}
exports.resumeCreateNewSamApp = resumeCreateNewSamApp;
/**
 * Runs `sam init` in the given context and returns useful metadata about its invocation
 */
function createNewSamApplication(channelLogger, samCliContext = samCliContext_1.getSamCliContext(), activationLaunchPath = new activationLaunchPath_1.ActivationLaunchPath()) {
    return __awaiter(this, void 0, void 0, function* () {
        const results = {
            reason: 'unknown',
            result: 'fail',
            runtime: 'unknown'
        };
        try {
            yield validateSamCli(samCliContext.validator);
            const wizardContext = new samInitWizard_1.DefaultCreateNewSamAppWizardContext();
            const config = yield new samInitWizard_1.CreateNewSamAppWizard(wizardContext).run();
            if (!config) {
                results.result = 'cancel';
                results.reason = 'userCancelled';
                return results;
            }
            results.runtime = config.runtime;
            // TODO: Make this selectable in the wizard to account for runtimes with multiple dependency managers
            const dependencyManager = samLambdaRuntime_1.getDependencyManager(config.runtime);
            const initArguments = {
                name: config.name,
                location: config.location.fsPath,
                runtime: config.runtime,
                dependencyManager
            };
            yield samCliInit_1.runSamCliInit(initArguments, samCliContext);
            results.result = 'pass';
            const uri = yield getMainUri(config);
            if (!uri) {
                results.reason = 'fileNotFound';
                return results;
            }
            // In case adding the workspace folder triggers a VS Code restart, instruct extension to
            // launch app file after activation.
            activationLaunchPath.setLaunchPath(uri.fsPath);
            yield addWorkspaceFolder({
                uri: config.location,
                name: path.basename(config.location.fsPath)
            });
            yield vscode.window.showTextDocument(uri);
            activationLaunchPath.clearLaunchPath();
            results.reason = 'complete';
        }
        catch (err) {
            const checkLogsMessage = messages_1.makeCheckLogsMessage();
            channelLogger.channel.show(true);
            channelLogger.error('AWS.samcli.initWizard.general.error', 'An error occurred while creating a new SAM Application. {0}', checkLogsMessage);
            const error = err;
            channelLogger.logger.error(error);
            results.result = 'fail';
            results.reason = 'error';
            // An error occured, so do not try to open any files during the next extension activation
            activationLaunchPath.clearLaunchPath();
        }
        return results;
    });
}
exports.createNewSamApplication = createNewSamApplication;
function validateSamCli(samCliValidator) {
    return __awaiter(this, void 0, void 0, function* () {
        const validationResult = yield samCliValidator.detectValidSamCli();
        samCliValidationUtils_1.throwAndNotifyIfInvalid(validationResult);
    });
}
function getMainUri(config) {
    return __awaiter(this, void 0, void 0, function* () {
        const samTemplatePath = path.resolve(config.location.fsPath, config.name, 'template.yaml');
        if (yield filesystemUtilities_1.fileExists(samTemplatePath)) {
            return vscode.Uri.file(samTemplatePath);
        }
        else {
            vscode.window.showWarningMessage(localize('AWS.samcli.initWizard.source.error.notFound', 'Project created successfully, but main source code file not found: {0}', samTemplatePath));
        }
    });
}
function addWorkspaceFolder(folder) {
    return __awaiter(this, void 0, void 0, function* () {
        // No-op if the folder is already in the workspace.
        if (vscode.workspace.getWorkspaceFolder(folder.uri)) {
            return;
        }
        yield workspaceUtils_1.addFolderToWorkspace(folder);
    });
}
function applyResultsToMetadata(createResults, metadata) {
    let metadataResult;
    switch (createResults.result) {
        case 'pass':
            metadataResult = telemetryTypes_1.MetadataResult.Pass;
            break;
        case 'cancel':
            metadataResult = telemetryTypes_1.MetadataResult.Cancel;
            break;
        case 'fail':
        default:
            metadataResult = telemetryTypes_1.MetadataResult.Fail;
            break;
    }
    metadata.set('runtime', createResults.runtime);
    metadata.set(telemetryTypes_1.METADATA_FIELD_NAME.RESULT, metadataResult.toString());
    metadata.set(telemetryTypes_1.METADATA_FIELD_NAME.REASON, createResults.reason);
}
exports.applyResultsToMetadata = applyResultsToMetadata;
//# sourceMappingURL=createNewSamApp.js.map