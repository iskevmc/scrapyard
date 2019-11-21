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
const vscode = require("vscode");
const nls = require("vscode-nls");
const filesystemUtilities_1 = require("../../filesystemUtilities");
const childProcess_1 = require("../../utilities/childProcess");
const textUtilities_1 = require("../../utilities/textUtilities");
const localize = nls.loadMessageBundle();
exports.WAIT_FOR_DEBUGGER_MESSAGES = {
    PYTHON: 'Waiting for debugger to attach...',
    NODEJS: 'Debugger listening on',
    DOTNET: 'Waiting for the debugger to attach...'
};
class DefaultSamLocalInvokeCommand {
    constructor(channelLogger, debuggerAttachCues = [
        exports.WAIT_FOR_DEBUGGER_MESSAGES.PYTHON,
        exports.WAIT_FOR_DEBUGGER_MESSAGES.NODEJS
    ]) {
        this.channelLogger = channelLogger;
        this.debuggerAttachCues = debuggerAttachCues;
    }
    invoke(_a) {
        var { options = {} } = _a, params = __rest(_a, ["options"]);
        return __awaiter(this, void 0, void 0, function* () {
            this.channelLogger.info('AWS.running.command', 'Running command: {0}', `${params.command} ${params.args.join(' ')}`);
            const childProcess = new childProcess_1.ChildProcess(params.command, options, ...params.args);
            let debuggerPromiseClosed = false;
            const debuggerPromise = new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let checkForDebuggerAttachCue = params.isDebug;
                yield childProcess.start({
                    onStdout: (text) => {
                        this.emitMessage(text);
                    },
                    onStderr: (text) => {
                        this.emitMessage(text);
                        if (checkForDebuggerAttachCue) {
                            // Look for messages like "Waiting for debugger to attach" before returning back to caller
                            if (this.debuggerAttachCues.some(cue => text.includes(cue))) {
                                checkForDebuggerAttachCue = false;
                                this.channelLogger.logger.verbose('Local SAM App should be ready for a debugger to attach now.');
                                debuggerPromiseClosed = true;
                                resolve();
                            }
                        }
                    },
                    onClose: (code, signal) => {
                        this.channelLogger.logger.verbose(`The child process for sam local invoke closed with code ${code}`);
                        this.channelLogger.channel.appendLine(localize('AWS.samcli.local.invoke.ended', 'Local invoke of SAM Application has ended.'));
                        // Handles scenarios where the process exited before we anticipated.
                        // Example: We didn't see an expected debugger attach cue, and the process or docker container
                        // was terminated by the user, or the user manually attached to the sam app.
                        if (!debuggerPromiseClosed) {
                            debuggerPromiseClosed = true;
                            reject(new Error('The SAM Application closed unexpectedly'));
                        }
                    },
                    onError: (error) => {
                        this.channelLogger.error('AWS.samcli.local.invoke.error', 'Error encountered running local SAM Application', error);
                        debuggerPromiseClosed = true;
                        reject(error);
                    }
                });
                if (!params.isDebug) {
                    this.channelLogger.logger.verbose('Local SAM App does not expect a debugger to attach.');
                    debuggerPromiseClosed = true;
                    resolve();
                }
            }));
            const awaitedPromises = params.timeout ? [debuggerPromise, params.timeout.timer] : [debuggerPromise];
            yield Promise.race(awaitedPromises).catch(() => __awaiter(this, void 0, void 0, function* () {
                // did debugger promise resolve/reject? if not, this was a timeout: kill the process
                // otherwise, process closed out on its own; no need to kill the process
                if (!debuggerPromiseClosed) {
                    const err = new Error('The SAM process did not make the debugger available within the timelimit');
                    this.channelLogger.error('AWS.samcli.local.invoke.debugger.timeout', 'The SAM process did not make the debugger available within the time limit', err);
                    if (!childProcess.killed) {
                        childProcess.kill();
                    }
                    throw err;
                }
            }));
        });
    }
    emitMessage(text) {
        // From VS Code API: If no debug session is active, output sent to the debug console is not shown.
        // We send text to output channel and debug console to ensure no text is lost.
        this.channelLogger.channel.append(textUtilities_1.removeAnsi(text));
        vscode.debug.activeDebugConsole.append(text);
    }
}
exports.DefaultSamLocalInvokeCommand = DefaultSamLocalInvokeCommand;
class SamCliLocalInvokeInvocation {
    /**
     * @see SamCliLocalInvokeInvocationArguments for parameter info
     * skipPullImage - Defaults to false (the latest Docker image will be pulled down if necessary)
     */
    constructor(_a) {
        var { skipPullImage = false } = _a, params = __rest(_a, ["skipPullImage"]);
        this.templateResourceName = params.templateResourceName;
        this.templatePath = params.templatePath;
        this.eventPath = params.eventPath;
        this.environmentVariablePath = params.environmentVariablePath;
        this.debugPort = params.debugPort;
        this.invoker = params.invoker;
        this.dockerNetwork = params.dockerNetwork;
        this.skipPullImage = skipPullImage;
        this.debuggerPath = params.debuggerPath;
    }
    execute(timeout) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.validate();
            const args = [
                'local',
                'invoke',
                this.templateResourceName,
                '--template',
                this.templatePath,
                '--event',
                this.eventPath,
                '--env-vars',
                this.environmentVariablePath
            ];
            this.addArgumentIf(args, !!this.debugPort, '-d', this.debugPort);
            this.addArgumentIf(args, !!this.dockerNetwork, '--docker-network', this.dockerNetwork);
            this.addArgumentIf(args, !!this.skipPullImage, '--skip-pull-image');
            this.addArgumentIf(args, !!this.debuggerPath, '--debugger-path', this.debuggerPath);
            yield this.invoker.invoke({
                command: 'sam',
                args,
                isDebug: !!this.debugPort,
                timeout
            });
        });
    }
    validate() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.templateResourceName) {
                throw new Error('template resource name is missing or empty');
            }
            if (!(yield filesystemUtilities_1.fileExists(this.templatePath))) {
                throw new Error(`template path does not exist: ${this.templatePath}`);
            }
            if (!(yield filesystemUtilities_1.fileExists(this.eventPath))) {
                throw new Error(`event path does not exist: ${this.eventPath}`);
            }
        });
    }
    addArgumentIf(args, addIfConditional, ...argsToAdd) {
        if (addIfConditional) {
            args.push(...argsToAdd);
        }
    }
}
exports.SamCliLocalInvokeInvocation = SamCliLocalInvokeInvocation;
//# sourceMappingURL=samCliLocalInvoke.js.map