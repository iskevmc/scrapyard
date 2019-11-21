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
class MultiStepWizard {
    constructor() { }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            let step = this.startStep;
            while (step) {
                step = yield step();
            }
            return this.getResult();
        });
    }
}
exports.MultiStepWizard = MultiStepWizard;
//# sourceMappingURL=multiStepWizard.js.map