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
const childProcess_1 = require("../utilities/childProcess");
const vsCodeUtils_1 = require("../utilities/vsCodeUtils");
// TODO: Replace with a library such as https://www.npmjs.com/package/node-docker-api.
class DefaultDockerInvokeContext {
    constructor(outputChannel) {
        this.channelLogger = vsCodeUtils_1.getChannelLogger(outputChannel);
    }
    run(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const process = new childProcess_1.ChildProcess('docker', {}, ...(args || []));
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let stderr;
                yield process.start({
                    onStdout: (text) => {
                        this.channelLogger.channel.append(text);
                    },
                    onStderr: (text) => {
                        stderr += text;
                    },
                    onError: (error) => {
                        reject(error);
                    },
                    onClose: (code, signal) => {
                        if (code) {
                            const errorMessage = `Could not invoke docker with arguments: [${args.join(', ')}].` +
                                `${JSON.stringify({
                                    exitCode: code,
                                    stdErr: stderr
                                }, undefined, 4)}`;
                            reject(new Error(errorMessage));
                        }
                        resolve();
                    }
                });
            }));
        });
    }
}
class DefaultDockerClient {
    constructor(outputChannel, context = new DefaultDockerInvokeContext(outputChannel)) {
        this.context = context;
    }
    invoke({ command, image, removeOnExit, mount, entryPoint }) {
        return __awaiter(this, void 0, void 0, function* () {
            const args = [command];
            if (removeOnExit) {
                args.push('--rm');
            }
            if (mount) {
                args.push('--mount', `type=${mount.type},src=${mount.source},dst=${mount.destination}`);
            }
            if (entryPoint) {
                args.push('--entrypoint', entryPoint.command);
            }
            args.push(image);
            if (entryPoint) {
                args.push(...entryPoint.args);
            }
            yield this.context.run(args);
        });
    }
}
exports.DefaultDockerClient = DefaultDockerClient;
//# sourceMappingURL=dockerClient.js.map