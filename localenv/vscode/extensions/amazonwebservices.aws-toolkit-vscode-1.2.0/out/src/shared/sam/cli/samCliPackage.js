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
const samCliInvokerUtils_1 = require("./samCliInvokerUtils");
function runSamCliPackage(packageArguments, invoker, logger = logger_1.getLogger()) {
    return __awaiter(this, void 0, void 0, function* () {
        const childProcessResult = yield invoker.invoke({
            arguments: [
                'package',
                '--template-file',
                packageArguments.sourceTemplateFile,
                '--s3-bucket',
                packageArguments.s3Bucket,
                '--output-template-file',
                packageArguments.destinationTemplateFile,
                '--region',
                packageArguments.region,
                '--profile',
                packageArguments.profile
            ]
        });
        samCliInvokerUtils_1.logAndThrowIfUnexpectedExitCode(childProcessResult, 0, logger);
    });
}
exports.runSamCliPackage = runSamCliPackage;
//# sourceMappingURL=samCliPackage.js.map