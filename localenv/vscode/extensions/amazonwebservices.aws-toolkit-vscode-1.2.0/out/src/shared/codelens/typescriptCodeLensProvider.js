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
const path = require("path");
const vscode = require("vscode");
const cloudformation_1 = require("../cloudformation/cloudformation");
const filesystemUtilities_1 = require("../filesystemUtilities");
const samCliLocalInvoke_1 = require("../sam/cli/samCliLocalInvoke");
const telemetryTypes_1 = require("../telemetry/telemetryTypes");
const telemetryUtils_1 = require("../telemetry/telemetryUtils");
const typescriptLambdaHandlerSearch_1 = require("../typescriptLambdaHandlerSearch");
const vsCodeUtils_1 = require("../utilities/vsCodeUtils");
const logger_1 = require("../logger");
const defaultValidatingSamCliProcessInvoker_1 = require("../sam/cli/defaultValidatingSamCliProcessInvoker");
const pathUtils_1 = require("../utilities/pathUtils");
const codeLensUtils_1 = require("./codeLensUtils");
const localLambdaRunner_1 = require("./localLambdaRunner");
const supportedNodeJsRuntimes = new Set(['nodejs8.10', 'nodejs10.x']);
function getSamProjectDirPathForFile(filepath) {
    return __awaiter(this, void 0, void 0, function* () {
        const packageJsonPath = yield filesystemUtilities_1.findFileInParentPaths(path.dirname(filepath), 'package.json');
        if (!packageJsonPath) {
            throw new Error(// TODO: Do we want to localize errors? This might be confusing if we need to review logs.
            vsCodeUtils_1.localize('AWS.error.sam.local.package_json_not_found', 'Unable to find package.json related to {0}', filepath));
        }
        return path.dirname(packageJsonPath);
    });
}
function initialize({ configuration, outputChannel: toolkitOutputChannel, processInvoker = new defaultValidatingSamCliProcessInvoker_1.DefaultValidatingSamCliProcessInvoker({}), localInvokeCommand = new samCliLocalInvoke_1.DefaultSamLocalInvokeCommand(vsCodeUtils_1.getChannelLogger(toolkitOutputChannel), [
    samCliLocalInvoke_1.WAIT_FOR_DEBUGGER_MESSAGES.NODEJS
]), telemetryService }) {
    const invokeLambda = (params) => __awaiter(this, void 0, void 0, function* () {
        const samProjectCodeRoot = yield getSamProjectDirPathForFile(params.document.uri.fsPath);
        let debugPort;
        if (params.isDebug) {
            debugPort = yield vsCodeUtils_1.getDebugPort();
        }
        const debugConfig = {
            type: 'node',
            request: 'attach',
            name: 'SamLocalDebug',
            preLaunchTask: undefined,
            address: 'localhost',
            port: debugPort,
            localRoot: samProjectCodeRoot,
            remoteRoot: '/var/task',
            protocol: 'inspector',
            skipFiles: ['/var/runtime/node_modules/**/*.js', '<node_internals>/**/*.js']
        };
        const localLambdaRunner = new localLambdaRunner_1.LocalLambdaRunner(configuration, params, debugPort, params.runtime, toolkitOutputChannel, processInvoker, localInvokeCommand, debugConfig, samProjectCodeRoot, telemetryService);
        yield localLambdaRunner.run();
    });
    const command = codeLensUtils_1.getInvokeCmdKey('javascript');
    telemetryUtils_1.registerCommand({
        command,
        callback: (params) => __awaiter(this, void 0, void 0, function* () {
            const logger = logger_1.getLogger();
            const resource = yield cloudformation_1.CloudFormation.getResourceFromTemplate({
                handlerName: params.handlerName,
                templatePath: params.samTemplate.fsPath
            });
            const runtime = cloudformation_1.CloudFormation.getRuntime(resource);
            if (!supportedNodeJsRuntimes.has(runtime)) {
                logger.error(`Javascript local invoke on ${params.document.uri.fsPath} encountered` +
                    ` unsupported runtime ${runtime}`);
                vscode.window.showErrorMessage(vsCodeUtils_1.localize('AWS.samcli.local.invoke.runtime.unsupported', 'Unsupported {0} runtime: {1}', 'javascript', runtime));
            }
            else {
                yield invokeLambda(Object.assign({ runtime }, params));
            }
            return codeLensUtils_1.getMetricDatum({
                isDebug: params.isDebug,
                runtime
            });
        }),
        telemetryName: {
            namespace: telemetryTypes_1.TelemetryNamespace.Lambda,
            name: 'invokelocal'
        }
    });
}
exports.initialize = initialize;
function makeTypescriptCodeLensProvider() {
    return {
        provideCodeLenses: (document, token) => __awaiter(this, void 0, void 0, function* () {
            const search = new typescriptLambdaHandlerSearch_1.TypescriptLambdaHandlerSearch(document.uri);
            const handlers = yield search.findCandidateLambdaHandlers();
            // For Javascript CodeLenses, store the complete relative pathed handler name
            // (eg: src/app.handler) instead of only the pure handler name (eg: app.handler)
            // Without this, the CodeLens command is unable to resolve a match back to a sam template.
            // This is done to address https://github.com/aws/aws-toolkit-vscode/issues/757
            yield decorateHandlerNames(handlers, document.uri.fsPath);
            return codeLensUtils_1.makeCodeLenses({
                document,
                handlers,
                token,
                language: 'javascript'
            });
        })
    };
}
exports.makeTypescriptCodeLensProvider = makeTypescriptCodeLensProvider;
/**
 * Applies a full relative path to the Javascript handler that will be stored in the CodeLens commands.
 * @param handlers Handlers to apply relative paths to
 * @param parentDocumentPath Path to the file containing these Lambda Handlers
 */
function decorateHandlerNames(handlers, parentDocumentPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const parentDir = path.dirname(parentDocumentPath);
        const packageJsonPath = yield filesystemUtilities_1.findFileInParentPaths(parentDir, 'package.json');
        if (!packageJsonPath) {
            return;
        }
        const relativePath = localLambdaRunner_1.getHandlerRelativePath({
            codeRoot: path.dirname(packageJsonPath),
            filePath: parentDocumentPath
        });
        handlers.forEach(handler => {
            const handlerName = handler.handlerName;
            handler.handlerName = pathUtils_1.normalizeSeparator(path.join(relativePath, handlerName));
        });
    });
}
//# sourceMappingURL=typescriptCodeLensProvider.js.map