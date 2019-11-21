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
const crossSpawn = require("cross-spawn");
/**
 * Convenience class to manage a child process
 * To use:
 * - instantiate
 * - call and await run to get the results (pass or fail)
 */
class ChildProcess {
    constructor(process, options, ...args) {
        this.process = process;
        this.options = options;
        this.args = args;
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let childProcessError;
                const stdoutChunks = [];
                const stderrChunks = [];
                yield this.start({
                    onStdout: text => stdoutChunks.push(text),
                    onStderr: text => stderrChunks.push(text),
                    onError: error => (childProcessError = error),
                    onClose: (code, signal) => {
                        const processResult = {
                            exitCode: code,
                            stdout: stdoutChunks.join().trim(),
                            stderr: stderrChunks.join().trim(),
                            error: childProcessError
                        };
                        resolve(processResult);
                    }
                }).catch(reject);
                if (!this.childProcess) {
                    reject('child process not started');
                }
            }));
        });
    }
    start(params) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.childProcess) {
                throw new Error('process already started');
            }
            this.childProcess = crossSpawn(this.process, this.args, this.options);
            this.childProcess.stdout.on('data', (data) => {
                if (params.onStdout) {
                    params.onStdout(data.toString());
                }
            });
            this.childProcess.stderr.on('data', (data) => {
                if (params.onStderr) {
                    params.onStderr(data.toString());
                }
            });
            this.childProcess.on('error', error => {
                if (params.onError) {
                    params.onError(error);
                }
            });
            this.childProcess.once('close', (code, signal) => {
                if (params.onClose) {
                    params.onClose(code, signal);
                }
                this.childProcess.stdout.removeAllListeners();
                this.childProcess.stderr.removeAllListeners();
                this.childProcess.removeAllListeners();
            });
        });
    }
    kill(signal) {
        if (this.childProcess && !this.killed) {
            this.childProcess.kill(signal);
        }
        else {
            throw new Error('Attempting to kill a process that has already been killed');
        }
    }
    get killed() {
        // default to true for safety
        return this.childProcess ? this.childProcess.killed : true;
    }
}
exports.ChildProcess = ChildProcess;
//# sourceMappingURL=childProcess.js.map