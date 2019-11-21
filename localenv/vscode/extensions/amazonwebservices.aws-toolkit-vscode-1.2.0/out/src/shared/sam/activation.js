"use strict";
/*!
 * Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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
const createNewSamApp_1 = require("../../lambda/commands/createNewSamApp");
const deploySamApplication_1 = require("../../lambda/commands/deploySamApplication");
const samParameterCompletionItemProvider_1 = require("../../lambda/config/samParameterCompletionItemProvider");
const csLensProvider = require("../codelens/csharpCodeLensProvider");
const pyLensProvider = require("../codelens/pythonCodeLensProvider");
const tsLensProvider = require("../codelens/typescriptCodeLensProvider");
const settingsConfiguration_1 = require("../settingsConfiguration");
const telemetryTypes_1 = require("../telemetry/telemetryTypes");
const telemetryUtils_1 = require("../telemetry/telemetryUtils");
const promiseUtilities_1 = require("../utilities/promiseUtilities");
const vsCodeUtils_1 = require("../utilities/vsCodeUtils");
const samCliContext_1 = require("./cli/samCliContext");
const samCliDetection_1 = require("./cli/samCliDetection");
/**
 * Activate serverless related functionality for the extension.
 */
function activate(activateArguments) {
    return __awaiter(this, void 0, void 0, function* () {
        const channelLogger = vsCodeUtils_1.getChannelLogger(activateArguments.outputChannel);
        samCliContext_1.initialize({
            settingsConfiguration: activateArguments.toolkitSettings
        });
        activateArguments.extensionContext.subscriptions.push(...(yield activateCodeLensProviders(activateArguments.toolkitSettings, activateArguments.outputChannel, activateArguments.telemetryService)));
        yield registerServerlessCommands({
            awsContext: activateArguments.awsContext,
            extensionContext: activateArguments.extensionContext,
            regionProvider: activateArguments.regionProvider,
            channelLogger
        });
        activateArguments.extensionContext.subscriptions.push(vscode.languages.registerCompletionItemProvider({
            language: 'json',
            scheme: 'file',
            pattern: '**/.aws/parameters.json'
        }, new samParameterCompletionItemProvider_1.SamParameterCompletionItemProvider(), '"'));
        yield samCliDetection_1.detectSamCli(false);
        yield createNewSamApp_1.resumeCreateNewSamApp();
    });
}
exports.activate = activate;
function registerServerlessCommands(params) {
    return __awaiter(this, void 0, void 0, function* () {
        params.extensionContext.subscriptions.push(telemetryUtils_1.registerCommand({
            command: 'aws.samcli.detect',
            callback: () => __awaiter(this, void 0, void 0, function* () { return yield promiseUtilities_1.PromiseSharer.getExistingPromiseOrCreate('samcli.detect', () => __awaiter(this, void 0, void 0, function* () { return yield samCliDetection_1.detectSamCli(true); })); })
        }));
        params.extensionContext.subscriptions.push(telemetryUtils_1.registerCommand({
            command: 'aws.lambda.createNewSamApp',
            callback: () => __awaiter(this, void 0, void 0, function* () {
                const createNewSamApplicationResults = yield createNewSamApp_1.createNewSamApplication(params.channelLogger);
                const datum = telemetryUtils_1.defaultMetricDatum('new');
                datum.metadata = new Map();
                createNewSamApp_1.applyResultsToMetadata(createNewSamApplicationResults, datum.metadata);
                return {
                    datum
                };
            }),
            telemetryName: {
                namespace: telemetryTypes_1.TelemetryNamespace.Project,
                name: 'new'
            }
        }));
        params.extensionContext.subscriptions.push(telemetryUtils_1.registerCommand({
            command: 'aws.deploySamApplication',
            callback: () => __awaiter(this, void 0, void 0, function* () {
                return yield deploySamApplication_1.deploySamApplication({
                    channelLogger: params.channelLogger,
                    regionProvider: params.regionProvider,
                    extensionContext: params.extensionContext
                }, {
                    awsContext: params.awsContext
                });
            }),
            telemetryName: {
                namespace: telemetryTypes_1.TelemetryNamespace.Lambda,
                name: 'deploy'
            }
        }));
        // TODO : Register CodeLens commands from here instead of in xxxCodeLensProvider.ts::initialize
    });
}
function activateCodeLensProviders(configuration, toolkitOutputChannel, telemetryService) {
    return __awaiter(this, void 0, void 0, function* () {
        const disposables = [];
        const providerParams = {
            configuration,
            outputChannel: toolkitOutputChannel,
            telemetryService
        };
        tsLensProvider.initialize(providerParams);
        disposables.push(vscode.languages.registerCodeLensProvider(
        // TODO : Turn into a constant to be consistent with Python, C#
        [
            {
                language: 'javascript',
                scheme: 'file'
            }
        ], tsLensProvider.makeTypescriptCodeLensProvider()));
        yield pyLensProvider.initialize(providerParams);
        disposables.push(vscode.languages.registerCodeLensProvider(pyLensProvider.PYTHON_ALLFILES, yield pyLensProvider.makePythonCodeLensProvider(new settingsConfiguration_1.DefaultSettingsConfiguration('python'))));
        yield csLensProvider.initialize(providerParams);
        disposables.push(vscode.languages.registerCodeLensProvider(csLensProvider.CSHARP_ALLFILES, yield csLensProvider.makeCSharpCodeLensProvider()));
        return disposables;
    });
}
//# sourceMappingURL=activation.js.map