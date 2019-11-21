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
const filesystemUtilities_1 = require("../../filesystemUtilities");
const logger_1 = require("../../logger");
const samCliInvoker_1 = require("./samCliInvoker");
const samCliInvokerUtils_1 = require("./samCliInvokerUtils");
class SamCliBuildInvocation {
    /**
     * @see SamCliBuildInvocationArguments for parameter info
     * invoker - Defaults to DefaultSamCliProcessInvoker
     * useContainer - Defaults to false (function will be built on local machine instead of in a docker image)
     * skipPullImage - Defaults to false (the latest Docker image will be pulled down if necessary)
     */
    constructor(_a, context = { file: getDefaultFileFunctions() }) {
        var { invoker = new samCliInvoker_1.DefaultSamCliProcessInvoker(), useContainer = false, skipPullImage = false } = _a, params = __rest(_a, ["invoker", "useContainer", "skipPullImage"]);
        this.context = context;
        this.buildDir = params.buildDir;
        this.baseDir = params.baseDir;
        this.templatePath = params.templatePath;
        this.environmentVariables = params.environmentVariables;
        this.invoker = invoker;
        this.useContainer = useContainer;
        this.dockerNetwork = params.dockerNetwork;
        this.skipPullImage = skipPullImage;
        this.manifestPath = params.manifestPath;
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.validate();
            const invokeArgs = ['build', '--build-dir', this.buildDir, '--template', this.templatePath];
            this.addArgumentIf(invokeArgs, !!this.baseDir, '--base-dir', this.baseDir);
            this.addArgumentIf(invokeArgs, !!this.dockerNetwork, '--docker-network', this.dockerNetwork);
            this.addArgumentIf(invokeArgs, !!this.useContainer, '--use-container');
            this.addArgumentIf(invokeArgs, !!this.skipPullImage, '--skip-pull-image');
            this.addArgumentIf(invokeArgs, !!this.manifestPath, '--manifest', this.manifestPath);
            const env = Object.assign({}, process.env, this.environmentVariables);
            const childProcessResult = yield this.invoker.invoke({
                spawnOptions: { env },
                arguments: invokeArgs
            });
            samCliInvokerUtils_1.logAndThrowIfUnexpectedExitCode(childProcessResult, 0);
        });
    }
    addArgumentIf(args, addIfConditional, ...argsToAdd) {
        if (addIfConditional) {
            args.push(...argsToAdd);
        }
    }
    validate() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.context.file.fileExists(this.templatePath))) {
                const logger = logger_1.getLogger();
                const err = new Error(`template path does not exist: ${this.templatePath}`);
                logger.error(err);
                throw err;
            }
        });
    }
}
exports.SamCliBuildInvocation = SamCliBuildInvocation;
function getDefaultFileFunctions() {
    return {
        fileExists: filesystemUtilities_1.fileExists
    };
}
//# sourceMappingURL=samCliBuild.js.map