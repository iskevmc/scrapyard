"use strict";
/*!
 * Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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
const debugConfiguration_1 = require("../../lambda/local/debugConfiguration");
const dockerClient_1 = require("../clients/dockerClient");
const cloudformation_1 = require("../cloudformation/cloudformation");
const filesystem_1 = require("../filesystem");
const logger_1 = require("../logger");
const samCliInvoker_1 = require("../sam/cli/samCliInvoker");
const samCliLocalInvoke_1 = require("../sam/cli/samCliLocalInvoke");
const telemetryTypes_1 = require("../telemetry/telemetryTypes");
const telemetryUtils_1 = require("../telemetry/telemetryUtils");
const pathUtils_1 = require("../utilities/pathUtils");
const vsCodeUtils_1 = require("../utilities/vsCodeUtils");
const codeLensUtils_1 = require("./codeLensUtils");
const localLambdaRunner_1 = require("./localLambdaRunner");
exports.CSHARP_LANGUAGE = 'csharp';
exports.CSHARP_ALLFILES = [
    {
        scheme: 'file',
        language: exports.CSHARP_LANGUAGE
    }
];
const REGEXP_RESERVED_WORD_PUBLIC = /\bpublic\b/;
function initialize({ configuration, outputChannel: toolkitOutputChannel, processInvoker = new samCliInvoker_1.DefaultSamCliProcessInvoker(), telemetryService, localInvokeCommand = new samCliLocalInvoke_1.DefaultSamLocalInvokeCommand(vsCodeUtils_1.getChannelLogger(toolkitOutputChannel), [
    samCliLocalInvoke_1.WAIT_FOR_DEBUGGER_MESSAGES.DOTNET
]) }) {
    return __awaiter(this, void 0, void 0, function* () {
        const command = codeLensUtils_1.getInvokeCmdKey(exports.CSHARP_LANGUAGE);
        telemetryUtils_1.registerCommand({
            command,
            callback: (params) => __awaiter(this, void 0, void 0, function* () {
                return yield onLocalInvokeCommand({
                    lambdaLocalInvokeParams: params,
                    configuration,
                    toolkitOutputChannel,
                    processInvoker,
                    localInvokeCommand,
                    telemetryService
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
class DefaultOnLocalInvokeCommandContext {
    constructor(outputChannel) {
        this.dockerClient = new dockerClient_1.DefaultDockerClient(outputChannel);
    }
    installDebugger(args) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield _installDebugger(args, { dockerClient: this.dockerClient });
        });
    }
}
function getCodeUri(resource, samTemplateUri) {
    const rawCodeUri = cloudformation_1.CloudFormation.getCodeUri(resource);
    return path.isAbsolute(rawCodeUri) ? rawCodeUri : path.join(path.dirname(samTemplateUri.fsPath), rawCodeUri);
}
/**
 * The command that is run when user clicks on Run Local or Debug Local CodeLens
 * Accepts object containing the following params:
 * @param configuration - SettingsConfiguration (for invokeLambdaFunction)
 * @param toolkitOutputChannel - "AWS Toolkit" output channel
 * @param commandName - Name of the VS Code Command currently running
 * @param lambdaLocalInvokeParams - Information about the Lambda Handler to invoke locally
 * @param processInvoker - SAM CLI Process invoker
 * @param taskInvoker - SAM CLI Task invoker
 * @param telemetryService - Telemetry service for metrics
 */
function onLocalInvokeCommand({ configuration, toolkitOutputChannel, lambdaLocalInvokeParams, processInvoker, localInvokeCommand, telemetryService, loadCloudFormationTemplate = (_args) => __awaiter(this, void 0, void 0, function* () { return yield cloudformation_1.CloudFormation.load(_args); }), getResourceFromTemplateResource = (_args) => __awaiter(this, void 0, void 0, function* () { return yield cloudformation_1.CloudFormation.getResourceFromTemplateResources(_args); }) }, context = new DefaultOnLocalInvokeCommandContext(toolkitOutputChannel)) {
    return __awaiter(this, void 0, void 0, function* () {
        const channelLogger = vsCodeUtils_1.getChannelLogger(toolkitOutputChannel);
        const template = yield loadCloudFormationTemplate(lambdaLocalInvokeParams.samTemplate.fsPath);
        const resource = yield getResourceFromTemplateResource({
            templateResources: template.Resources,
            handlerName: lambdaLocalInvokeParams.handlerName
        });
        const runtime = cloudformation_1.CloudFormation.getRuntime(resource);
        try {
            // Switch over to the output channel so the user has feedback that we're getting things ready
            channelLogger.channel.show(true);
            channelLogger.info('AWS.output.sam.local.start', 'Preparing to run {0} locally...', lambdaLocalInvokeParams.handlerName);
            const baseBuildDir = yield localLambdaRunner_1.makeBuildDir();
            const codeUri = getCodeUri(resource, lambdaLocalInvokeParams.samTemplate);
            const documentUri = lambdaLocalInvokeParams.document.uri;
            const handlerName = lambdaLocalInvokeParams.handlerName;
            const inputTemplatePath = yield localLambdaRunner_1.makeInputTemplate({
                baseBuildDir,
                codeDir: codeUri,
                relativeFunctionHandler: handlerName,
                runtime,
                globals: template.Globals,
                properties: resource.Properties
            });
            const buildArgs = {
                baseBuildDir,
                channelLogger,
                codeDir: codeUri,
                inputTemplatePath,
                samProcessInvoker: processInvoker
            };
            if (lambdaLocalInvokeParams.isDebug) {
                buildArgs.environmentVariables = {
                    SAM_BUILD_MODE: 'debug'
                };
            }
            const samTemplatePath = yield localLambdaRunner_1.executeSamBuild(buildArgs);
            const invokeArgs = {
                baseBuildDir,
                documentUri,
                originalHandlerName: handlerName,
                handlerName,
                originalSamTemplatePath: lambdaLocalInvokeParams.samTemplate.fsPath,
                samTemplatePath,
                runtime
            };
            const invokeContext = {
                channelLogger,
                configuration,
                samLocalInvokeCommand: localInvokeCommand,
                telemetryService
            };
            if (!lambdaLocalInvokeParams.isDebug) {
                yield localLambdaRunner_1.invokeLambdaFunction(invokeArgs, invokeContext);
            }
            else {
                const { debuggerPath } = yield context.installDebugger({
                    runtime,
                    targetFolder: codeUri,
                    channelLogger
                });
                const port = yield vsCodeUtils_1.getDebugPort();
                const debugConfig = debugConfiguration_1.makeCoreCLRDebugConfiguration({
                    port,
                    codeUri
                });
                yield localLambdaRunner_1.invokeLambdaFunction(Object.assign({}, invokeArgs, { debugArgs: {
                        debugConfig,
                        debugPort: port,
                        debuggerPath
                    } }), {
                    channelLogger,
                    configuration,
                    samLocalInvokeCommand: localInvokeCommand,
                    telemetryService
                });
            }
        }
        catch (err) {
            const error = err;
            channelLogger.error('AWS.error.during.sam.local', 'An error occurred trying to run SAM Application locally: {0}', error);
        }
        return codeLensUtils_1.getMetricDatum({
            isDebug: lambdaLocalInvokeParams.isDebug,
            runtime
        });
    });
}
function makeCSharpCodeLensProvider() {
    return __awaiter(this, void 0, void 0, function* () {
        const logger = logger_1.getLogger();
        const codeLensProvider = {
            provideCodeLenses: (document, token) => __awaiter(this, void 0, void 0, function* () {
                const handlers = yield getLambdaHandlerCandidates(document);
                logger.debug('csharpCodeLensProvider.makeCSharpCodeLensProvider handlers:', JSON.stringify(handlers, undefined, 2));
                return codeLensUtils_1.makeCodeLenses({
                    document,
                    handlers,
                    token,
                    language: 'csharp'
                });
            })
        };
        return codeLensProvider;
    });
}
exports.makeCSharpCodeLensProvider = makeCSharpCodeLensProvider;
function getLambdaHandlerCandidates(document) {
    return __awaiter(this, void 0, void 0, function* () {
        const assemblyName = yield getAssemblyName(document.uri);
        if (!assemblyName) {
            return [];
        }
        const symbols = (yield vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', document.uri)) || [];
        return getLambdaHandlerComponents(document, symbols, assemblyName).map(lambdaHandlerComponents => {
            const handlerName = generateDotNetLambdaHandler(lambdaHandlerComponents);
            return {
                filename: document.uri.fsPath,
                handlerName,
                range: lambdaHandlerComponents.handlerRange
            };
        });
    });
}
exports.getLambdaHandlerCandidates = getLambdaHandlerCandidates;
function getAssemblyName(sourceCodeUri) {
    return __awaiter(this, void 0, void 0, function* () {
        const projectFile = yield findParentProjectFile(sourceCodeUri);
        if (!projectFile) {
            return undefined;
        }
        // TODO : Perform an XPATH parse on the project file
        // If Project/PropertyGroup/AssemblyName exists, use that. Otherwise use the file name.
        return path.parse(projectFile.fsPath).name;
    });
}
function getLambdaHandlerComponents(document, symbols, assembly) {
    return (symbols
        .filter(symbol => symbol.kind === vscode.SymbolKind.Namespace)
        // Find relevant classes within the namespace
        .reduce((accumulator, namespaceSymbol) => {
        accumulator.push(...namespaceSymbol.children
            .filter(namespaceChildSymbol => namespaceChildSymbol.kind === vscode.SymbolKind.Class)
            .filter(classSymbol => isPublicClassSymbol(document, classSymbol))
            .map(classSymbol => {
            return {
                namespace: namespaceSymbol,
                class: classSymbol
            };
        }));
        return accumulator;
    }, [])
        // Find relevant methods within each class
        .reduce((accumulator, lambdaHandlerComponents) => {
        accumulator.push(...lambdaHandlerComponents.class.children
            .filter(classChildSymbol => classChildSymbol.kind === vscode.SymbolKind.Method)
            .filter(methodSymbol => isPublicMethodSymbol(document, methodSymbol))
            .map(methodSymbol => {
            return {
                assembly,
                namespace: lambdaHandlerComponents.namespace.name,
                class: document.getText(lambdaHandlerComponents.class.selectionRange),
                method: document.getText(methodSymbol.selectionRange),
                handlerRange: methodSymbol.range
            };
        }));
        return accumulator;
    }, []));
}
exports.getLambdaHandlerComponents = getLambdaHandlerComponents;
function findParentProjectFile(sourceCodeUri, findWorkspaceFiles = vscode.workspace.findFiles) {
    return __awaiter(this, void 0, void 0, function* () {
        const workspaceProjectFiles = yield findWorkspaceFiles('**/*.csproj');
        // Use the project file "closest" in the parent chain to sourceCodeUri
        // Assumption: only one .csproj file will exist in a given folder
        const parentProjectFiles = workspaceProjectFiles
            .filter(uri => {
            const dirname = pathUtils_1.dirnameWithTrailingSlash(uri.fsPath);
            return sourceCodeUri.fsPath.startsWith(dirname);
        })
            .sort()
            .reverse();
        return parentProjectFiles.length === 0 ? undefined : parentProjectFiles[0];
    });
}
exports.findParentProjectFile = findParentProjectFile;
function isPublicClassSymbol(document, symbol) {
    if (symbol.kind === vscode.SymbolKind.Class) {
        // from "public class Processor" pull "public class "
        const classDeclarationBeforeNameRange = new vscode.Range(symbol.range.start, symbol.selectionRange.start);
        const classDeclarationBeforeName = document.getText(classDeclarationBeforeNameRange);
        return REGEXP_RESERVED_WORD_PUBLIC.test(classDeclarationBeforeName);
    }
    return false;
}
exports.isPublicClassSymbol = isPublicClassSymbol;
function isPublicMethodSymbol(document, symbol) {
    if (symbol.kind === vscode.SymbolKind.Method) {
        // from "public async Task<Response> foo()" pull "public async Task<Response> "
        const signatureBeforeMethodNameRange = new vscode.Range(symbol.range.start, symbol.selectionRange.start);
        const signatureBeforeMethodName = document.getText(signatureBeforeMethodNameRange);
        return REGEXP_RESERVED_WORD_PUBLIC.test(signatureBeforeMethodName);
    }
    return false;
}
exports.isPublicMethodSymbol = isPublicMethodSymbol;
function generateDotNetLambdaHandler(components) {
    return `${components.assembly}::${components.namespace}.${components.class}::${components.method}`;
}
exports.generateDotNetLambdaHandler = generateDotNetLambdaHandler;
function getDebuggerPath(parentFolder) {
    return path.resolve(parentFolder, '.vsdbg');
}
function ensureDebuggerPathExists(parentFolder) {
    return __awaiter(this, void 0, void 0, function* () {
        const vsdbgPath = getDebuggerPath(parentFolder);
        try {
            yield filesystem_1.access(vsdbgPath);
        }
        catch (_a) {
            yield filesystem_1.mkdir(vsdbgPath);
        }
    });
}
function _installDebugger({ runtime, targetFolder, channelLogger }, { dockerClient }) {
    return __awaiter(this, void 0, void 0, function* () {
        yield ensureDebuggerPathExists(targetFolder);
        try {
            const vsdbgPath = getDebuggerPath(targetFolder);
            channelLogger.info('AWS.samcli.local.invoke.debugger.install', 'Installing .NET Core Debugger to {0}...', vsdbgPath);
            yield dockerClient.invoke({
                command: 'run',
                image: `lambci/lambda:${runtime}`,
                removeOnExit: true,
                mount: {
                    type: 'bind',
                    source: vsdbgPath,
                    destination: '/vsdbg'
                },
                entryPoint: {
                    command: 'bash',
                    args: ['-c', 'curl -sSL https://aka.ms/getvsdbgsh | bash /dev/stdin -v latest -l /vsdbg']
                }
            });
            return { debuggerPath: vsdbgPath };
        }
        catch (err) {
            channelLogger.info('AWS.samcli.local.invoke.debugger.install.failed', 'Error installing .NET Core Debugger: {0}', err instanceof Error ? err : String(err));
            throw err;
        }
    });
}
//# sourceMappingURL=csharpCodeLensProvider.js.map