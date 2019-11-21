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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const tcpPortUsed = require("tcp-port-used");
const vscode = require("vscode");
const configureLocalLambda_1 = require("../../lambda/local/configureLocalLambda");
const detectLocalLambdas_1 = require("../../lambda/local/detectLocalLambdas");
const filesystem_1 = require("../filesystem");
const filesystemUtilities_1 = require("../filesystemUtilities");
const samCliBuild_1 = require("../sam/cli/samCliBuild");
const samCliLocalInvoke_1 = require("../sam/cli/samCliLocalInvoke");
const samTemplateGenerator_1 = require("../templates/sam/samTemplateGenerator");
const disposableFiles_1 = require("../utilities/disposableFiles");
const templates_1 = require("../../lambda/config/templates");
const samLambdaRuntime_1 = require("../../lambda/models/samLambdaRuntime");
const pathUtils_1 = require("../utilities/pathUtils");
const timeoutUtils_1 = require("../utilities/timeoutUtils");
const vsCodeUtils_1 = require("../utilities/vsCodeUtils");
const TEMPLATE_RESOURCE_NAME = 'awsToolkitSamLocalResource';
const SAM_LOCAL_PORT_CHECK_RETRY_INTERVAL_MILLIS = 125;
const SAM_LOCAL_PORT_CHECK_RETRY_TIMEOUT_MILLIS_DEFAULT = 30000;
const MAX_DEBUGGER_RETRIES_DEFAULT = 30;
const ATTACH_DEBUGGER_RETRY_DELAY_MILLIS = 200;
// TODO: Consider replacing LocalLambdaRunner use with associated duplicative functions
class LocalLambdaRunner {
    constructor(configuration, localInvokeParams, debugPort, runtime, 
    // @ts-ignore noUnusedLocals
    outputChannel, processInvoker, localInvokeCommand, debugConfig, codeRootDirectoryPath, telemetryService, channelLogger = vsCodeUtils_1.getChannelLogger(outputChannel)) {
        this.configuration = configuration;
        this.localInvokeParams = localInvokeParams;
        this.runtime = runtime;
        this.outputChannel = outputChannel;
        this.processInvoker = processInvoker;
        this.localInvokeCommand = localInvokeCommand;
        this.debugConfig = debugConfig;
        this.codeRootDirectoryPath = codeRootDirectoryPath;
        this.telemetryService = telemetryService;
        this.channelLogger = channelLogger;
        if (localInvokeParams.isDebug && !debugPort) {
            throw new Error('Debug port must be provided when launching in debug mode');
        }
        this._debugPort = debugPort;
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Switch over to the output channel so the user has feedback that we're getting things ready
                this.channelLogger.channel.show(true);
                this.channelLogger.info('AWS.output.sam.local.start', 'Preparing to run {0} locally...', this.localInvokeParams.handlerName);
                const inputTemplate = yield this.generateInputTemplate(this.codeRootDirectoryPath);
                const samBuildTemplate = yield executeSamBuild({
                    baseBuildDir: yield this.getBaseBuildFolder(),
                    channelLogger: this.channelLogger,
                    codeDir: this.codeRootDirectoryPath,
                    inputTemplatePath: inputTemplate,
                    samProcessInvoker: this.processInvoker
                });
                yield this.invokeLambdaFunction(samBuildTemplate);
            }
            catch (err) {
                const error = err;
                this.channelLogger.error('AWS.error.during.sam.local', 'An error occurred trying to run SAM Application locally: {0}', error);
                return;
            }
        });
    }
    get debugPort() {
        if (!this._debugPort) {
            throw new Error('Debug port was expected but is undefined');
        }
        return this._debugPort;
    }
    getBaseBuildFolder() {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: Clean up folder structure
            if (!this._baseBuildFolder) {
                this._baseBuildFolder = yield filesystemUtilities_1.makeTemporaryToolkitFolder();
                disposableFiles_1.ExtensionDisposableFiles.getInstance().addFolder(this._baseBuildFolder);
            }
            return this._baseBuildFolder;
        });
    }
    /**
     * Create the SAM Template that will be passed in to sam build.
     * @returns Path to the generated template file
     */
    generateInputTemplate(rootCodeFolder) {
        return __awaiter(this, void 0, void 0, function* () {
            const buildFolder = yield this.getBaseBuildFolder();
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(this.localInvokeParams.workspaceFolder.uri);
            let properties;
            let globals;
            if (workspaceFolder) {
                const lambdas = yield detectLocalLambdas_1.detectLocalLambdas([workspaceFolder]);
                const existingLambda = lambdas.find(lambda => lambda.handler === this.localInvokeParams.handlerName);
                if (existingLambda) {
                    if (existingLambda.resource && existingLambda.resource.Properties) {
                        properties = existingLambda.resource.Properties;
                    }
                    if (existingLambda.templateGlobals) {
                        globals = existingLambda.templateGlobals;
                    }
                }
            }
            return yield makeInputTemplate({
                baseBuildDir: buildFolder,
                codeDir: rootCodeFolder,
                relativeFunctionHandler: this.localInvokeParams.handlerName,
                globals,
                properties,
                runtime: this.runtime
            });
        });
    }
    /**
     * Runs `sam local invoke` against the provided template file
     * @param samTemplatePath sam template to run locally
     */
    invokeLambdaFunction(samTemplatePath) {
        return __awaiter(this, void 0, void 0, function* () {
            this.channelLogger.info('AWS.output.starting.sam.app.locally', 'Starting the SAM Application locally (see Terminal for output)');
            const eventPath = path.join(yield this.getBaseBuildFolder(), 'event.json');
            const environmentVariablePath = path.join(yield this.getBaseBuildFolder(), 'env-vars.json');
            const config = yield this.getConfig();
            const maxRetries = getAttachDebuggerMaxRetryLimit(this.configuration, MAX_DEBUGGER_RETRIES_DEFAULT);
            yield filesystem_1.writeFile(eventPath, JSON.stringify(config.event || {}));
            yield filesystem_1.writeFile(environmentVariablePath, JSON.stringify(getEnvironmentVariables(config)));
            const command = new samCliLocalInvoke_1.SamCliLocalInvokeInvocation({
                templateResourceName: TEMPLATE_RESOURCE_NAME,
                templatePath: samTemplatePath,
                eventPath,
                environmentVariablePath,
                debugPort: !!this._debugPort ? this._debugPort.toString() : undefined,
                invoker: this.localInvokeCommand,
                dockerNetwork: config.dockerNetwork
            });
            const timer = createInvokeTimer(this.configuration);
            yield command.execute(timer);
            if (this.localInvokeParams.isDebug) {
                const isPortOpen = yield waitForDebugPort({
                    debugPort: this.debugPort,
                    configuration: this.configuration,
                    channelLogger: this.channelLogger,
                    timeoutDuration: timer.remainingTime
                });
                if (!isPortOpen) {
                    this.channelLogger.warn('AWS.samcli.local.invoke.port.not.open', 
                    // tslint:disable-next-line:max-line-length
                    "The debug port doesn't appear to be open. The debugger might not succeed when attaching to your SAM Application.");
                }
                const attachResults = yield attachDebugger({
                    debugConfig: this.debugConfig,
                    maxRetries,
                    retryDelayMillis: ATTACH_DEBUGGER_RETRY_DELAY_MILLIS,
                    channelLogger: this.channelLogger,
                    onRecordAttachDebuggerMetric: (attachResult, attempts) => {
                        recordAttachDebuggerMetric({
                            telemetryService: this.telemetryService,
                            result: attachResult,
                            attempts,
                            durationMillis: timer.elapsedTime,
                            runtime: this.runtime
                        });
                    }
                });
                if (attachResults.success) {
                    yield showDebugConsole({
                        logger: this.channelLogger.logger
                    });
                }
            }
        });
    }
    getConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(this.localInvokeParams.document.uri);
            if (!workspaceFolder) {
                return templates_1.generateDefaultHandlerConfig();
            }
            const config = yield configureLocalLambda_1.getLocalLambdaConfiguration(workspaceFolder, this.localInvokeParams.handlerName, this.localInvokeParams.samTemplate);
            return config;
        });
    }
} // end class LocalLambdaRunner
exports.LocalLambdaRunner = LocalLambdaRunner;
exports.makeBuildDir = () => __awaiter(this, void 0, void 0, function* () {
    const buildDir = yield filesystemUtilities_1.makeTemporaryToolkitFolder();
    disposableFiles_1.ExtensionDisposableFiles.getInstance().addFolder(buildDir);
    return buildDir;
});
function getHandlerRelativePath(params) {
    return path.relative(params.codeRoot, path.dirname(params.filePath));
}
exports.getHandlerRelativePath = getHandlerRelativePath;
function getRelativeFunctionHandler(params) {
    // Make function handler relative to baseDir
    let relativeFunctionHandler;
    if (shouldAppendRelativePathToFunctionHandler(params.runtime)) {
        relativeFunctionHandler = pathUtils_1.normalizeSeparator(path.join(params.handlerFileRelativePath, params.handlerName));
    }
    else {
        relativeFunctionHandler = params.handlerName;
    }
    return relativeFunctionHandler;
}
exports.getRelativeFunctionHandler = getRelativeFunctionHandler;
function getLambdaInfoFromExistingTemplate(params) {
    return __awaiter(this, void 0, void 0, function* () {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(params.workspaceUri);
        let existingLambda;
        if (workspaceFolder) {
            const lambdas = yield detectLocalLambdas_1.detectLocalLambdas([workspaceFolder]);
            existingLambda = lambdas.find(lambda => lambda.handler === params.relativeOriginalFunctionHandler);
        }
        return existingLambda;
    });
}
exports.getLambdaInfoFromExistingTemplate = getLambdaInfoFromExistingTemplate;
function makeInputTemplate(params) {
    return __awaiter(this, void 0, void 0, function* () {
        let newTemplate = new samTemplateGenerator_1.SamTemplateGenerator()
            .withFunctionHandler(params.relativeFunctionHandler)
            .withResourceName(TEMPLATE_RESOURCE_NAME)
            .withRuntime(params.runtime)
            .withCodeUri(params.codeDir);
        if (params.properties) {
            if (params.properties.Environment) {
                newTemplate = newTemplate.withEnvironment(params.properties.Environment);
            }
            if (params.properties.MemorySize) {
                newTemplate = newTemplate.withMemorySize(params.properties.MemorySize);
            }
            if (params.properties.Timeout) {
                newTemplate = newTemplate.withTimeout(params.properties.Timeout);
            }
        }
        if (params.globals) {
            newTemplate = newTemplate.withGlobals(params.globals);
        }
        const inputTemplatePath = path.join(params.baseBuildDir, 'input', 'input-template.yaml');
        disposableFiles_1.ExtensionDisposableFiles.getInstance().addFolder(inputTemplatePath);
        yield newTemplate.generate(inputTemplatePath);
        return inputTemplatePath;
    });
}
exports.makeInputTemplate = makeInputTemplate;
function executeSamBuild({ baseBuildDir, channelLogger, codeDir, inputTemplatePath, manifestPath, environmentVariables, samProcessInvoker }) {
    return __awaiter(this, void 0, void 0, function* () {
        channelLogger.info('AWS.output.building.sam.application', 'Building SAM Application...');
        const samBuildOutputFolder = path.join(baseBuildDir, 'output');
        const samCliArgs = {
            buildDir: samBuildOutputFolder,
            baseDir: codeDir,
            templatePath: inputTemplatePath,
            invoker: samProcessInvoker,
            manifestPath,
            environmentVariables
        };
        yield new samCliBuild_1.SamCliBuildInvocation(samCliArgs).execute();
        channelLogger.info('AWS.output.building.sam.application.complete', 'Build complete.');
        return path.join(samBuildOutputFolder, 'template.yaml');
    });
}
exports.executeSamBuild = executeSamBuild;
function invokeLambdaFunction(invokeArgs, { channelLogger, configuration, samLocalInvokeCommand, telemetryService }) {
    return __awaiter(this, void 0, void 0, function* () {
        channelLogger.info('AWS.output.starting.sam.app.locally', 'Starting the SAM Application locally (see Terminal for output)');
        channelLogger.logger.debug(`localLambdaRunner.invokeLambdaFunction: ${JSON.stringify(invokeArgs, undefined, 2)}`);
        const eventPath = path.join(invokeArgs.baseBuildDir, 'event.json');
        const environmentVariablePath = path.join(invokeArgs.baseBuildDir, 'env-vars.json');
        const config = yield getConfig({
            handlerName: invokeArgs.originalHandlerName,
            documentUri: invokeArgs.documentUri,
            samTemplate: vscode.Uri.file(invokeArgs.originalSamTemplatePath)
        });
        const maxRetries = getAttachDebuggerMaxRetryLimit(configuration, MAX_DEBUGGER_RETRIES_DEFAULT);
        yield filesystem_1.writeFile(eventPath, JSON.stringify(config.event || {}));
        yield filesystem_1.writeFile(environmentVariablePath, JSON.stringify(getEnvironmentVariables(config)));
        const localInvokeArgs = {
            templateResourceName: TEMPLATE_RESOURCE_NAME,
            templatePath: invokeArgs.samTemplatePath,
            eventPath,
            environmentVariablePath,
            invoker: samLocalInvokeCommand,
            dockerNetwork: config.dockerNetwork
        };
        const debugArgs = invokeArgs.debugArgs;
        if (debugArgs) {
            localInvokeArgs.debugPort = debugArgs.debugPort.toString();
            localInvokeArgs.debuggerPath = debugArgs.debuggerPath;
        }
        const command = new samCliLocalInvoke_1.SamCliLocalInvokeInvocation(localInvokeArgs);
        const timer = createInvokeTimer(configuration);
        yield command.execute(timer);
        if (debugArgs) {
            const isPortOpen = yield waitForDebugPort({
                debugPort: debugArgs.debugPort,
                configuration,
                channelLogger,
                timeoutDuration: timer.remainingTime
            });
            if (!isPortOpen) {
                channelLogger.warn('AWS.samcli.local.invoke.port.not.open', 
                // tslint:disable-next-line:max-line-length
                "The debug port doesn't appear to be open. The debugger might not succeed when attaching to your SAM Application.");
            }
            const attachResults = yield attachDebugger({
                debugConfig: debugArgs.debugConfig,
                maxRetries,
                retryDelayMillis: ATTACH_DEBUGGER_RETRY_DELAY_MILLIS,
                channelLogger,
                onRecordAttachDebuggerMetric: (attachResult, attempts) => {
                    recordAttachDebuggerMetric({
                        telemetryService: telemetryService,
                        result: attachResult,
                        attempts,
                        durationMillis: timer.elapsedTime,
                        runtime: invokeArgs.runtime
                    });
                }
            });
            if (attachResults.success) {
                yield showDebugConsole({
                    logger: channelLogger.logger
                });
            }
        }
    });
}
exports.invokeLambdaFunction = invokeLambdaFunction;
const getConfig = (params) => __awaiter(this, void 0, void 0, function* () {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(params.documentUri);
    if (!workspaceFolder) {
        return templates_1.generateDefaultHandlerConfig();
    }
    const config = yield configureLocalLambda_1.getLocalLambdaConfiguration(workspaceFolder, params.handlerName, params.samTemplate);
    return config;
});
const getEnvironmentVariables = (config) => {
    if (!!config.environmentVariables) {
        return {
            [TEMPLATE_RESOURCE_NAME]: config.environmentVariables
        };
    }
    else {
        return {};
    }
};
function attachDebugger(_a) {
    var { retryDelayMillis = ATTACH_DEBUGGER_RETRY_DELAY_MILLIS, onStartDebugging = vscode.debug.startDebugging, onWillRetry = () => __awaiter(this, void 0, void 0, function* () {
        yield new Promise(resolve => {
            setTimeout(resolve, retryDelayMillis);
        });
    }) } = _a, params = __rest(_a, ["retryDelayMillis", "onStartDebugging", "onWillRetry"]);
    return __awaiter(this, void 0, void 0, function* () {
        const channelLogger = params.channelLogger;
        const logger = params.channelLogger.logger;
        logger.debug(`localLambdaRunner.attachDebugger: startDebugging with debugConfig: ${JSON.stringify(params.debugConfig, undefined, 2)}`);
        let isDebuggerAttached;
        let retries = 0;
        channelLogger.info('AWS.output.sam.local.attaching', 'Attaching debugger to SAM Application...');
        do {
            isDebuggerAttached = yield onStartDebugging(undefined, params.debugConfig);
            if (isDebuggerAttached === undefined) {
                if (retries < params.maxRetries) {
                    if (onWillRetry) {
                        yield onWillRetry();
                    }
                    retries += 1;
                }
                else {
                    channelLogger.error('AWS.output.sam.local.attach.retry.limit.exceeded', 'Retry limit reached while trying to attach the debugger.');
                    isDebuggerAttached = false;
                }
            }
        } while (isDebuggerAttached === undefined);
        if (params.onRecordAttachDebuggerMetric) {
            params.onRecordAttachDebuggerMetric(isDebuggerAttached, retries + 1);
        }
        if (isDebuggerAttached) {
            channelLogger.info('AWS.output.sam.local.attach.success', 'Debugger attached');
        }
        else {
            channelLogger.error('AWS.output.sam.local.attach.failure', 
            // tslint:disable-next-line:max-line-length
            'Unable to attach Debugger. Check the Terminal tab for output. If it took longer than expected to successfully start, you may still attach to it.');
        }
        return {
            success: isDebuggerAttached
        };
    });
}
exports.attachDebugger = attachDebugger;
function waitForDebugPort({ debugPort, configuration, channelLogger, timeoutDuration }) {
    return __awaiter(this, void 0, void 0, function* () {
        channelLogger.info('AWS.output.sam.local.waiting', 'Waiting for SAM Application to start before attaching debugger...');
        try {
            // this should not fail: if it hits this point, the port should be open
            // this function always attempts once no matter the timeoutDuration
            yield tcpPortUsed.waitUntilUsed(debugPort, SAM_LOCAL_PORT_CHECK_RETRY_INTERVAL_MILLIS, timeoutDuration);
            return true;
        }
        catch (err) {
            channelLogger.logger.verbose(`Timed out after ${timeoutDuration} ms waiting for port ${debugPort} to open: ${err}`);
            return false;
        }
    });
}
function recordAttachDebuggerMetric(params) {
    const currTime = new Date();
    const namespace = params.result ? 'DebugAttachSuccess' : 'DebugAttachFailure';
    const metadata = new Map([['runtime', params.runtime]]);
    params.telemetryService.record({
        namespace: namespace,
        createTime: currTime,
        data: [
            {
                name: 'attempts',
                value: params.attempts,
                unit: 'Count',
                metadata
            },
            {
                name: 'duration',
                value: params.durationMillis,
                unit: 'Milliseconds',
                metadata
            }
        ]
    });
}
function getAttachDebuggerMaxRetryLimit(configuration, defaultValue) {
    return configuration.readSetting('samcli.debug.attach.retry.maximum', defaultValue);
}
function shouldAppendRelativePathToFunctionHandler(runtime) {
    // getFamily will throw an error if the runtime doesn't exist
    switch (samLambdaRuntime_1.getFamily(runtime)) {
        case samLambdaRuntime_1.SamLambdaRuntimeFamily.NodeJS:
        case samLambdaRuntime_1.SamLambdaRuntimeFamily.Python:
            return true;
        case samLambdaRuntime_1.SamLambdaRuntimeFamily.DotNetCore:
            return false;
        // if the runtime exists but for some reason we forgot to cover it here, throw anyway so we remember to cover it
        default:
            throw new Error('localLambdaRunner can not determine if runtime requires a relative path.');
    }
}
exports.shouldAppendRelativePathToFunctionHandler = shouldAppendRelativePathToFunctionHandler;
function createInvokeTimer(configuration) {
    const timelimit = configuration.readSetting('samcli.debug.attach.timeout.millis', SAM_LOCAL_PORT_CHECK_RETRY_TIMEOUT_MILLIS_DEFAULT);
    return new timeoutUtils_1.Timeout(timelimit);
}
/**
 * Brings the Debug Console in focus.
 * If the OutputChannel is showing, focus does not consistently switch over to the debug console, so we're
 * helping make this happen.
 */
function showDebugConsole(_a) {
    var { executeVsCodeCommand = vscode.commands.executeCommand } = _a, params = __rest(_a, ["executeVsCodeCommand"]);
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield executeVsCodeCommand('workbench.debug.action.toggleRepl');
        }
        catch (err) {
            // in case the vs code command changes or misbehaves, swallow error
            params.logger.verbose('Unable to switch to the Debug Console', err);
        }
    });
}
//# sourceMappingURL=localLambdaRunner.js.map