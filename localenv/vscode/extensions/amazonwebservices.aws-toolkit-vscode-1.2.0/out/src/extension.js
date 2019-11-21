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
const vscode = require("vscode");
const nls = require("vscode-nls");
const awsExplorer_1 = require("./awsexplorer/awsExplorer");
const awsClientBuilder_1 = require("./shared/awsClientBuilder");
const awsContextTreeCollection_1 = require("./shared/awsContextTreeCollection");
const defaultToolkitClientBuilder_1 = require("./shared/clients/defaultToolkitClientBuilder");
const constants_1 = require("./shared/constants");
const defaultCredentialsFileReaderWriter_1 = require("./shared/credentials/defaultCredentialsFileReaderWriter");
const userCredentialsUtils_1 = require("./shared/credentials/userCredentialsUtils");
const defaultAwsContext_1 = require("./shared/defaultAwsContext");
const defaultAwsContextCommands_1 = require("./shared/defaultAwsContextCommands");
const defaultResourceFetcher_1 = require("./shared/defaultResourceFetcher");
const defaultStatusBar_1 = require("./shared/defaultStatusBar");
const extensionGlobals_1 = require("./shared/extensionGlobals");
const extensionUtilities_1 = require("./shared/extensionUtilities");
const logger_1 = require("./shared/logger");
const activation_1 = require("./shared/logger/activation");
const defaultRegionProvider_1 = require("./shared/regions/defaultRegionProvider");
const activation_2 = require("./shared/sam/activation");
const settingsConfiguration_1 = require("./shared/settingsConfiguration");
const awsTelemetryOptOut_1 = require("./shared/telemetry/awsTelemetryOptOut");
const defaultTelemetryService_1 = require("./shared/telemetry/defaultTelemetryService");
const telemetryTypes_1 = require("./shared/telemetry/telemetryTypes");
const telemetryUtils_1 = require("./shared/telemetry/telemetryUtils");
const disposableFiles_1 = require("./shared/utilities/disposableFiles");
const vsCodeUtils_1 = require("./shared/utilities/vsCodeUtils");
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const env = process.env;
        if (!!env.VSCODE_NLS_CONFIG) {
            nls.config(JSON.parse(env.VSCODE_NLS_CONFIG))();
        }
        else {
            nls.config()();
        }
        const localize = nls.loadMessageBundle();
        extensionGlobals_1.ext.context = context;
        yield activation_1.activate();
        const toolkitOutputChannel = vscode.window.createOutputChannel(localize('AWS.channel.aws.toolkit', 'AWS Toolkit'));
        try {
            yield new defaultCredentialsFileReaderWriter_1.DefaultCredentialsFileReaderWriter().setCanUseConfigFileIfExists();
            initializeIconPaths(context);
            const toolkitSettings = new settingsConfiguration_1.DefaultSettingsConfiguration(constants_1.extensionSettingsPrefix);
            const awsContext = new defaultAwsContext_1.DefaultAwsContext(toolkitSettings, context);
            const awsContextTrees = new awsContextTreeCollection_1.AwsContextTreeCollection();
            const resourceFetcher = new defaultResourceFetcher_1.DefaultResourceFetcher();
            const regionProvider = new defaultRegionProvider_1.DefaultRegionProvider(context, resourceFetcher);
            extensionGlobals_1.ext.awsContextCommands = new defaultAwsContextCommands_1.DefaultAWSContextCommands(awsContext, awsContextTrees, regionProvider);
            extensionGlobals_1.ext.sdkClientBuilder = new awsClientBuilder_1.DefaultAWSClientBuilder(awsContext);
            extensionGlobals_1.ext.toolkitClientBuilder = new defaultToolkitClientBuilder_1.DefaultToolkitClientBuilder();
            // check to see if current user is valid
            const currentProfile = awsContext.getCredentialProfileName();
            if (currentProfile) {
                const successfulLogin = yield userCredentialsUtils_1.UserCredentialsUtils.addUserDataToContext(currentProfile, awsContext);
                if (!successfulLogin) {
                    yield userCredentialsUtils_1.UserCredentialsUtils.removeUserDataFromContext(awsContext);
                    // tslint:disable-next-line: no-floating-promises
                    userCredentialsUtils_1.UserCredentialsUtils.notifyUserCredentialsAreBad(currentProfile);
                }
            }
            extensionGlobals_1.ext.statusBar = new defaultStatusBar_1.DefaultAWSStatusBar(awsContext, context);
            extensionGlobals_1.ext.telemetry = new defaultTelemetryService_1.DefaultTelemetryService(context, awsContext);
            new awsTelemetryOptOut_1.AwsTelemetryOptOut(extensionGlobals_1.ext.telemetry, toolkitSettings).ensureUserNotified().catch(err => {
                console.warn(`Exception while displaying opt-out message: ${err}`);
            });
            yield extensionGlobals_1.ext.telemetry.start();
            telemetryUtils_1.registerCommand({
                command: 'aws.login',
                callback: () => __awaiter(this, void 0, void 0, function* () { return yield extensionGlobals_1.ext.awsContextCommands.onCommandLogin(); }),
                telemetryName: {
                    namespace: telemetryTypes_1.TelemetryNamespace.Aws,
                    name: 'credentialslogin'
                }
            });
            telemetryUtils_1.registerCommand({
                command: 'aws.credential.profile.create',
                callback: () => __awaiter(this, void 0, void 0, function* () { return yield extensionGlobals_1.ext.awsContextCommands.onCommandCreateCredentialsProfile(); }),
                telemetryName: {
                    namespace: telemetryTypes_1.TelemetryNamespace.Aws,
                    name: 'credentialscreate'
                }
            });
            telemetryUtils_1.registerCommand({
                command: 'aws.logout',
                callback: () => __awaiter(this, void 0, void 0, function* () { return yield extensionGlobals_1.ext.awsContextCommands.onCommandLogout(); }),
                telemetryName: {
                    namespace: telemetryTypes_1.TelemetryNamespace.Aws,
                    name: 'credentialslogout'
                }
            });
            telemetryUtils_1.registerCommand({
                command: 'aws.showRegion',
                callback: () => __awaiter(this, void 0, void 0, function* () { return yield extensionGlobals_1.ext.awsContextCommands.onCommandShowRegion(); })
            });
            telemetryUtils_1.registerCommand({
                command: 'aws.hideRegion',
                callback: (node) => __awaiter(this, void 0, void 0, function* () {
                    yield extensionGlobals_1.ext.awsContextCommands.onCommandHideRegion(extensionUtilities_1.safeGet(node, x => x.regionCode));
                })
            });
            // register URLs in extension menu
            telemetryUtils_1.registerCommand({
                command: 'aws.help',
                callback: () => __awaiter(this, void 0, void 0, function* () {
                    vscode.env.openExternal(vscode.Uri.parse(constants_1.documentationUrl));
                })
            });
            telemetryUtils_1.registerCommand({
                command: 'aws.github',
                callback: () => __awaiter(this, void 0, void 0, function* () {
                    vscode.env.openExternal(vscode.Uri.parse(constants_1.githubUrl));
                })
            });
            telemetryUtils_1.registerCommand({
                command: 'aws.reportIssue',
                callback: () => __awaiter(this, void 0, void 0, function* () {
                    vscode.env.openExternal(vscode.Uri.parse(constants_1.reportIssueUrl));
                })
            });
            telemetryUtils_1.registerCommand({
                command: 'aws.quickStart',
                callback: () => __awaiter(this, void 0, void 0, function* () {
                    yield extensionUtilities_1.showQuickStartWebview(context);
                })
            });
            const providers = [new awsExplorer_1.AwsExplorer(awsContext, awsContextTrees, regionProvider, resourceFetcher)];
            providers.forEach(p => {
                p.initialize(context);
                context.subscriptions.push(vscode.window.registerTreeDataProvider(p.viewProviderId, p));
            });
            yield extensionGlobals_1.ext.statusBar.updateContext(undefined);
            yield disposableFiles_1.ExtensionDisposableFiles.initialize(context);
            yield activation_2.activate({
                awsContext,
                extensionContext: context,
                outputChannel: toolkitOutputChannel,
                regionProvider,
                telemetryService: extensionGlobals_1.ext.telemetry,
                toolkitSettings
            });
            extensionUtilities_1.toastNewUser(context, logger_1.getLogger());
        }
        catch (error) {
            const channelLogger = vsCodeUtils_1.getChannelLogger(toolkitOutputChannel);
            channelLogger.error('AWS.channel.aws.toolkit.activation.error', 'Error Activating AWS Toolkit', error);
            throw error;
        }
    });
}
exports.activate = activate;
function deactivate() {
    return __awaiter(this, void 0, void 0, function* () {
        yield extensionGlobals_1.ext.telemetry.shutdown();
    });
}
exports.deactivate = deactivate;
function initializeIconPaths(context) {
    extensionGlobals_1.ext.iconPaths.dark.help = context.asAbsolutePath('resources/dark/help.svg');
    extensionGlobals_1.ext.iconPaths.light.help = context.asAbsolutePath('resources/light/help.svg');
    extensionGlobals_1.ext.iconPaths.dark.cloudFormation = context.asAbsolutePath('resources/dark/cloudformation.svg');
    extensionGlobals_1.ext.iconPaths.light.cloudFormation = context.asAbsolutePath('resources/light/cloudformation.svg');
    extensionGlobals_1.ext.iconPaths.dark.lambda = context.asAbsolutePath('resources/dark/lambda.svg');
    extensionGlobals_1.ext.iconPaths.light.lambda = context.asAbsolutePath('resources/light/lambda.svg');
}
//# sourceMappingURL=extension.js.map