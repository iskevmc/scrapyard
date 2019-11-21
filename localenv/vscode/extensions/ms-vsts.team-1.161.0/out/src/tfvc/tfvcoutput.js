/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
class TfvcOutput {
    static CreateChannel(disposables) {
        return __awaiter(this, void 0, void 0, function* () {
            if (TfvcOutput._outputChannel !== undefined) {
                return;
            }
            TfvcOutput._outputChannel = vscode_1.window.createOutputChannel("TFVC");
            if (disposables) {
                disposables.push(TfvcOutput._outputChannel);
            }
        });
    }
    static AppendLine(line) {
        if (TfvcOutput._outputChannel) {
            TfvcOutput._outputChannel.append(line + "\n");
        }
    }
    static Show() {
        if (TfvcOutput._outputChannel) {
            TfvcOutput._outputChannel.show();
        }
    }
}
exports.TfvcOutput = TfvcOutput;

//# sourceMappingURL=tfvcoutput.js.map
