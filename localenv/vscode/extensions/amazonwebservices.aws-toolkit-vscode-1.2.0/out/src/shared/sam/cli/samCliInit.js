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
const semver = require("semver");
const samCliContext_1 = require("./samCliContext");
const samCliInvokerUtils_1 = require("./samCliInvokerUtils");
const samCliValidator_1 = require("./samCliValidator");
function runSamCliInit(initArguments, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const args = ['init', '--name', initArguments.name, '--runtime', initArguments.runtime];
        const samCliVersion = yield samCliContext_1.getSamCliVersion(context);
        if (semver.gte(samCliVersion, samCliValidator_1.SAM_CLI_VERSION_0_30)) {
            args.push('--no-interactive');
            args.push('--app-template', 'hello-world');
            args.push('--dependency-manager', initArguments.dependencyManager);
        }
        const childProcessResult = yield context.invoker.invoke({
            spawnOptions: { cwd: initArguments.location },
            arguments: args
        });
        samCliInvokerUtils_1.logAndThrowIfUnexpectedExitCode(childProcessResult, 0);
    });
}
exports.runSamCliInit = runSamCliInit;
//# sourceMappingURL=samCliInit.js.map