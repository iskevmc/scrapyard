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
const nls = require("vscode-nls");
const localize = nls.loadMessageBundle();
const vscode = require("vscode");
const detectLocalLambdas_1 = require("./detectLocalLambdas");
function selectLocalLambda(workspaceFolders = vscode.workspace.workspaceFolders, showQuickPick = vscode.window.showQuickPick) {
    return __awaiter(this, void 0, void 0, function* () {
        const localLambdas = (yield detectLocalLambdas_1.detectLocalLambdas(workspaceFolders)).map(lambda => (Object.assign({}, lambda, { label: lambda.lambda, description: lambda.templatePath })));
        return yield showQuickPick(localLambdas, {
            placeHolder: localize('AWS.message.prompt.selectLocalLambda.placeholder', 'Select a lambda function')
        });
    });
}
exports.selectLocalLambda = selectLocalLambda;
//# sourceMappingURL=selectLocalLambda.js.map