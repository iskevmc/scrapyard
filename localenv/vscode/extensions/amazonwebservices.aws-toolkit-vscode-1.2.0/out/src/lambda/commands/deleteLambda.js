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
const localize = nls.loadMessageBundle();
/**
 * @param message: Message displayed to user
 */
const confirm = (message) => __awaiter(this, void 0, void 0, function* () {
    // TODO: Re-use `confirm` throughout package (rather than cutting and pasting logic).
    const responseNo = localize('AWS.generic.response.no', 'No');
    const responseYes = localize('AWS.generic.response.yes', 'Yes');
    const response = yield vscode.window.showWarningMessage(message, responseYes, responseNo);
    return response === responseYes;
});
function deleteLambda(_a) {
    var { deleteParams, onConfirm = () => __awaiter(this, void 0, void 0, function* () {
        return yield confirm(localize('AWS.command.deleteLambda.confirm', "Are you sure you want to delete lambda function '{0}'?", deleteParams.functionName));
    }) } = _a, restParams = __rest(_a, ["deleteParams", "onConfirm"]);
    return __awaiter(this, void 0, void 0, function* () {
        if (!deleteParams.functionName) {
            return;
        }
        try {
            const isConfirmed = yield onConfirm();
            if (isConfirmed) {
                yield restParams.lambdaClient.deleteFunction(deleteParams.functionName);
                restParams.onRefresh();
            }
        }
        catch (err) {
            restParams.outputChannel.show(true);
            restParams.outputChannel.appendLine(localize('AWS.command.deleteLambda.error', "There was an error deleting lambda function '{0}'", deleteParams.functionName));
            restParams.outputChannel.appendLine(String(err)); // linter hates toString on type any
            restParams.outputChannel.appendLine('');
            restParams.onRefresh(); // Refresh in case it was already deleted.
        }
    });
}
exports.deleteLambda = deleteLambda;
//# sourceMappingURL=deleteLambda.js.map