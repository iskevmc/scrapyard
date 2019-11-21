"use strict";
/*!
 * Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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
const vscode_1 = require("vscode");
// may want to have multiple elements of data on the status bar,
// so wrapping in a class to allow for per-element update capability
class DefaultAWSStatusBar {
    constructor(awsContext, context) {
        this._awsContext = awsContext;
        this.credentialContext = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Right, 100);
        context.subscriptions.push(this.credentialContext);
        this._awsContext.onDidChangeContext((changedContext) => __awaiter(this, void 0, void 0, function* () { return yield this.updateContext(changedContext); }));
    }
    updateContext(eventContext) {
        return __awaiter(this, void 0, void 0, function* () {
            let profileName;
            if (eventContext) {
                profileName = eventContext.profileName;
            }
            else {
                profileName = this._awsContext.getCredentialProfileName();
            }
            if (profileName) {
                this.credentialContext.text = `${localize('AWS.title', 'AWS')}:${profileName}`;
                this.credentialContext.show();
            }
            else {
                this.credentialContext.hide();
            }
        });
    }
}
exports.DefaultAWSStatusBar = DefaultAWSStatusBar;
//# sourceMappingURL=defaultStatusBar.js.map