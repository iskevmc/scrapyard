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
const samCliInvoker_1 = require("./samCliInvoker");
const samCliValidationUtils_1 = require("./samCliValidationUtils");
const samCliValidator_1 = require("./samCliValidator");
/**
 * Validates the SAM CLI version before making calls to the SAM CLI.
 */
class DefaultValidatingSamCliProcessInvoker {
    constructor(params) {
        this.invokerContext = samCliInvoker_1.resolveSamCliProcessInvokerContext(params.invokerContext);
        this.invoker = params.invoker || new samCliInvoker_1.DefaultSamCliProcessInvoker(this.invokerContext);
        // Regardless of the sam cli invoker provided, the default validator will always use the standard invoker
        this.validator =
            params.validator ||
                new samCliValidator_1.DefaultSamCliValidator(new samCliValidator_1.DefaultSamCliValidatorContext(this.invokerContext.cliConfig, new samCliInvoker_1.DefaultSamCliProcessInvoker(this.invokerContext)));
    }
    invoke(options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.validateSamCli();
            return yield this.invoker.invoke(options);
        });
    }
    validateSamCli() {
        return __awaiter(this, void 0, void 0, function* () {
            const validationResult = yield this.validator.detectValidSamCli();
            // TODO : Showing dialog here is temporary until https://github.com/aws/aws-toolkit-vscode/issues/527
            // TODO : is complete. The dialog will be raised earlier than this point, leaving this to throw Errors.
            samCliValidationUtils_1.throwAndNotifyIfInvalid(validationResult);
        });
    }
}
exports.DefaultValidatingSamCliProcessInvoker = DefaultValidatingSamCliProcessInvoker;
//# sourceMappingURL=defaultValidatingSamCliProcessInvoker.js.map