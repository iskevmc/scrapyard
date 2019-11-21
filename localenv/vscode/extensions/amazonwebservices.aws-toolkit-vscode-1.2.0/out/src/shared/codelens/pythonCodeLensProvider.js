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
const os = require("os");
const path = require("path");
const vscode = require("vscode");
const cloudformation_1 = require("../cloudformation/cloudformation");
const filesystem_1 = require("../filesystem");
const filesystemUtilities_1 = require("../filesystemUtilities");
const logger_1 = require("../logger");
const defaultValidatingSamCliProcessInvoker_1 = require("../sam/cli/defaultValidatingSamCliProcessInvoker");
const samCliLocalInvoke_1 = require("../sam/cli/samCliLocalInvoke");
const telemetryTypes_1 = require("../telemetry/telemetryTypes");
const telemetryUtils_1 = require("../telemetry/telemetryUtils");
const vsCodeUtils_1 = require("../utilities/vsCodeUtils");
const codeLensUtils_1 = require("./codeLensUtils");
const localLambdaRunner_1 = require("./localLambdaRunner");
exports.PYTHON_LANGUAGE = 'python';
exports.PYTHON_ALLFILES = [
    {
        scheme: 'file',
        language: exports.PYTHON_LANGUAGE
    }
];
// TODO: Fix this! Implement a more robust/flexible solution. This is just a basic minimal proof of concept.
const getSamProjectDirPathForFile = (filepath) => __awaiter(this, void 0, void 0, function* () {
    return path.dirname(filepath);
});
function getLambdaHandlerCandidates({ uri, pythonSettings }) {
    return __awaiter(this, void 0, void 0, function* () {
        const PYTHON_JEDI_ENABLED_KEY = 'jediEnabled';
        const RETRY_INTERVAL_MS = 1000;
        const MAX_RETRIES = 10;
        const logger = logger_1.getLogger();
        const filename = uri.fsPath;
        let symbols = (yield vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', uri)) ||
            [];
        // A recent regression in vscode-python stops codelenses from rendering if we first return an empty array
        // (because symbols have not yet been loaded), then a non-empty array (when our codelens provider is re-invoked
        // upon symbols loading). To work around this, we attempt to wait for symbols to load before returning. We cannot
        // distinguish between "the document does not contain any symbols" and "the symbols have not yet been loaded", so
        // we stop retrying if we are still getting an empty result after several retries.
        //
        // This issue only surfaces when the setting `python.jediEnabled` is not set to false.
        // TODO: When the above issue is resolved, remove this workaround AND bump the minimum
        //       required VS Code version and/or add a minimum supported version for the Python
        //       extension.
        const jediEnabled = pythonSettings.readSetting(PYTHON_JEDI_ENABLED_KEY, true);
        if (jediEnabled) {
            for (let i = 0; i < MAX_RETRIES && !symbols.length; i++) {
                yield new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL_MS));
                symbols =
                    (yield vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', uri)) || [];
            }
        }
        return symbols
            .filter(sym => sym.kind === vscode.SymbolKind.Function)
            .map(symbol => {
            logger.debug(`pythonCodeLensProviderFound.getLambdaHandlerCandidates: ${JSON.stringify({
                filePath: uri.fsPath,
                handlerName: `${path.parse(filename).name}.${symbol.name}`
            })}`);
            return {
                filename,
                handlerName: `${path.parse(filename).name}.${symbol.name}`,
                range: symbol.range
            };
        });
    });
}
// Add create debugging manifest/requirements.txt containing ptvsd
const makePythonDebugManifest = (params) => __awaiter(this, void 0, void 0, function* () {
    let manifestText = '';
    const manfestPath = path.join(params.samProjectCodeRoot, 'requirements.txt');
    if (filesystemUtilities_1.fileExists(manfestPath)) {
        manifestText = yield filesystemUtilities_1.readFileAsString(manfestPath);
    }
    logger_1.getLogger().debug(`pythonCodeLensProvider.makePythonDebugManifest params: ${JSON.stringify(params, undefined, 2)}`);
    // TODO: Make this logic more robust. What if other module names include ptvsd?
    if (manifestText.indexOf('ptvsd') < 0) {
        manifestText += `${os.EOL}ptvsd>4.2,<5`;
        const debugManifestPath = path.join(params.outputDir, 'debug-requirements.txt');
        yield filesystem_1.writeFile(debugManifestPath, manifestText);
        return debugManifestPath;
    }
    // else we don't need to override the manifest. nothing to return
});
// tslint:disable:no-trailing-whitespace
const makeLambdaDebugFile = (params) => __awaiter(this, void 0, void 0, function* () {
    if (!params.outputDir) {
        throw new Error('Must specify outputDir');
    }
    const logger = logger_1.getLogger();
    const [handlerFilePrefix, handlerFunctionName] = params.handlerName.split('.');
    const debugHandlerFileName = `${handlerFilePrefix}___vsctk___debug`;
    const debugHandlerFunctionName = 'lambda_handler';
    // TODO: Sanitize handlerFilePrefix, handlerFunctionName, debugHandlerFunctionName
    try {
        logger.debug('pythonCodeLensProvider.makeLambdaDebugFile params:', JSON.stringify(params, undefined, 2));
        const template = `
# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import ptvsd
import sys
from ${handlerFilePrefix} import ${handlerFunctionName} as _handler


def ${debugHandlerFunctionName}(event, context):
    ptvsd.enable_attach(address=('0.0.0.0', ${params.debugPort}), redirect_output=False)
    print('${samCliLocalInvoke_1.WAIT_FOR_DEBUGGER_MESSAGES.PYTHON}')
    sys.stdout.flush()
    ptvsd.wait_for_attach()
    print('...debugger attached')
    sys.stdout.flush()
    return _handler(event, context)

`;
        const outFilePath = path.join(params.outputDir, `${debugHandlerFileName}.py`);
        logger.debug('pythonCodeLensProvider.makeLambdaDebugFile outFilePath:', outFilePath);
        yield filesystem_1.writeFile(outFilePath, template);
        return {
            outFilePath,
            debugHandlerName: `${debugHandlerFileName}.${debugHandlerFunctionName}`
        };
    }
    catch (err) {
        logger.error('makeLambdaDebugFile failed:', err);
        throw err;
    }
});
function getLocalRootVariants(filePath) {
    if (process.platform === 'win32' && codeLensUtils_1.DRIVE_LETTER_REGEX.test(filePath)) {
        return [
            filePath.replace(codeLensUtils_1.DRIVE_LETTER_REGEX, match => match.toLowerCase()),
            filePath.replace(codeLensUtils_1.DRIVE_LETTER_REGEX, match => match.toUpperCase())
        ];
    }
    return [filePath];
}
exports.getLocalRootVariants = getLocalRootVariants;
function makeDebugConfig({ debugPort, samProjectCodeRoot }) {
    const pathMappings = getLocalRootVariants(samProjectCodeRoot).map(variant => {
        return {
            localRoot: variant,
            remoteRoot: '/var/task'
        };
    });
    return {
        type: exports.PYTHON_LANGUAGE,
        request: 'attach',
        name: 'SamLocalDebug',
        host: 'localhost',
        port: debugPort,
        pathMappings,
        // Disable redirectOutput to prevent the Python Debugger from automatically writing stdout/stderr text
        // to the Debug Console. We're taking the child process stdout/stderr and explicitly writing that to
        // the Debug Console.
        redirectOutput: false
    };
}
function initialize({ configuration, outputChannel: toolkitOutputChannel, processInvoker = new defaultValidatingSamCliProcessInvoker_1.DefaultValidatingSamCliProcessInvoker({}), telemetryService, localInvokeCommand }) {
    return __awaiter(this, void 0, void 0, function* () {
        const logger = logger_1.getLogger();
        const channelLogger = vsCodeUtils_1.getChannelLogger(toolkitOutputChannel);
        if (!localInvokeCommand) {
            localInvokeCommand = new samCliLocalInvoke_1.DefaultSamLocalInvokeCommand(channelLogger, [samCliLocalInvoke_1.WAIT_FOR_DEBUGGER_MESSAGES.PYTHON]);
        }
        const invokeLambda = (args) => __awaiter(this, void 0, void 0, function* () {
            // Switch over to the output channel so the user has feedback that we're getting things ready
            channelLogger.channel.show(true);
            channelLogger.info('AWS.output.sam.local.start', 'Preparing to run {0} locally...', args.handlerName);
            let lambdaDebugFilePath;
            try {
                const samProjectCodeRoot = yield getSamProjectDirPathForFile(args.document.uri.fsPath);
                const baseBuildDir = yield localLambdaRunner_1.makeBuildDir();
                let debugPort;
                let handlerName = args.handlerName;
                let manifestPath;
                if (args.isDebug) {
                    debugPort = yield vsCodeUtils_1.getDebugPort();
                    const { debugHandlerName, outFilePath } = yield makeLambdaDebugFile({
                        handlerName: args.handlerName,
                        debugPort: debugPort,
                        outputDir: samProjectCodeRoot
                    });
                    lambdaDebugFilePath = outFilePath;
                    handlerName = debugHandlerName;
                    manifestPath = yield makePythonDebugManifest({
                        samProjectCodeRoot,
                        outputDir: baseBuildDir
                    });
                }
                const handlerFileRelativePath = localLambdaRunner_1.getHandlerRelativePath({
                    codeRoot: samProjectCodeRoot,
                    filePath: args.document.uri.fsPath
                });
                const relativeOriginalFunctionHandler = localLambdaRunner_1.getRelativeFunctionHandler({
                    handlerName: args.handlerName,
                    runtime: args.runtime,
                    handlerFileRelativePath
                });
                const relativeFunctionHandler = localLambdaRunner_1.getRelativeFunctionHandler({
                    handlerName: handlerName,
                    runtime: args.runtime,
                    handlerFileRelativePath
                });
                const lambdaInfo = yield localLambdaRunner_1.getLambdaInfoFromExistingTemplate({
                    workspaceUri: args.workspaceFolder.uri,
                    relativeOriginalFunctionHandler
                });
                const inputTemplatePath = yield localLambdaRunner_1.makeInputTemplate({
                    baseBuildDir,
                    codeDir: samProjectCodeRoot,
                    relativeFunctionHandler,
                    globals: lambdaInfo && lambdaInfo.templateGlobals ? lambdaInfo.templateGlobals : undefined,
                    properties: lambdaInfo && lambdaInfo.resource.Properties ? lambdaInfo.resource.Properties : undefined,
                    runtime: args.runtime
                });
                logger.debug(`pythonCodeLensProvider.invokeLambda: ${JSON.stringify({ samProjectCodeRoot, inputTemplatePath, handlerName, manifestPath }, undefined, 2)}`);
                const codeDir = samProjectCodeRoot;
                const samTemplatePath = yield localLambdaRunner_1.executeSamBuild({
                    baseBuildDir,
                    channelLogger,
                    codeDir,
                    inputTemplatePath,
                    manifestPath,
                    samProcessInvoker: processInvoker
                });
                const invokeArgs = {
                    baseBuildDir,
                    originalSamTemplatePath: args.samTemplate.fsPath,
                    samTemplatePath,
                    documentUri: args.document.uri,
                    originalHandlerName: args.handlerName,
                    handlerName,
                    runtime: args.runtime
                };
                if (args.isDebug) {
                    const debugConfig = makeDebugConfig({ debugPort, samProjectCodeRoot });
                    invokeArgs.debugArgs = {
                        debugConfig,
                        debugPort: debugConfig.port
                    };
                }
                yield localLambdaRunner_1.invokeLambdaFunction(invokeArgs, {
                    channelLogger,
                    configuration,
                    samLocalInvokeCommand: localInvokeCommand,
                    telemetryService
                });
            }
            catch (err) {
                const error = err;
                channelLogger.error('AWS.error.during.sam.local', 'An error occurred trying to run SAM Application locally: {0}', error);
            }
            finally {
                if (lambdaDebugFilePath) {
                    yield deleteFile(lambdaDebugFilePath);
                }
            }
        });
        const command = codeLensUtils_1.getInvokeCmdKey('python');
        telemetryUtils_1.registerCommand({
            command,
            callback: (params) => __awaiter(this, void 0, void 0, function* () {
                const resource = yield cloudformation_1.CloudFormation.getResourceFromTemplate({
                    handlerName: params.handlerName,
                    templatePath: params.samTemplate.fsPath
                });
                const runtime = cloudformation_1.CloudFormation.getRuntime(resource);
                yield invokeLambda(Object.assign({ runtime }, params));
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
    });
}
exports.initialize = initialize;
// Convenience method to swallow any errors
function deleteFile(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield filesystem_1.unlink(filePath);
        }
        catch (err) {
            logger_1.getLogger().warn(err);
        }
    });
}
function makePythonCodeLensProvider(pythonSettings) {
    return __awaiter(this, void 0, void 0, function* () {
        const logger = logger_1.getLogger();
        return {
            // CodeLensProvider
            provideCodeLenses: (document, token) => __awaiter(this, void 0, void 0, function* () {
                const handlers = yield getLambdaHandlerCandidates({
                    uri: document.uri,
                    pythonSettings
                });
                logger.debug('pythonCodeLensProvider.makePythonCodeLensProvider handlers:', JSON.stringify(handlers, undefined, 2));
                return codeLensUtils_1.makeCodeLenses({
                    document,
                    handlers,
                    token,
                    language: 'python'
                });
            })
        };
    });
}
exports.makePythonCodeLensProvider = makePythonCodeLensProvider;
//# sourceMappingURL=pythonCodeLensProvider.js.map