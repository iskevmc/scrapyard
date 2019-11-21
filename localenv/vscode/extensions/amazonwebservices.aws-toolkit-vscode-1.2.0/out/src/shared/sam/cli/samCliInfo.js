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
const logger_1 = require("../../logger");
const samCliInvoker_1 = require("./samCliInvoker");
const samCliInvokerUtils_1 = require("./samCliInvokerUtils");
class SamCliInfoInvocation {
    constructor(invoker = new samCliInvoker_1.DefaultSamCliProcessInvoker()) {
        this.invoker = invoker;
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            const childProcessResult = yield this.invoker.invoke({ arguments: ['--info'] });
            samCliInvokerUtils_1.logAndThrowIfUnexpectedExitCode(childProcessResult, 0);
            const response = this.convertOutput(childProcessResult.stdout);
            if (!response) {
                throw new Error('SAM CLI did not return expected data');
            }
            return response;
        });
    }
    /**
     * Parses the output into a typed object with expected data
     * @param text output from a `sam --info` call
     */
    convertOutput(text) {
        const logger = logger_1.getLogger();
        try {
            return JSON.parse(text);
        }
        catch (err) {
            logger.error(err);
            return undefined;
        }
    }
}
exports.SamCliInfoInvocation = SamCliInfoInvocation;
//# sourceMappingURL=samCliInfo.js.map