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
const constants_1 = require("./constants");
const utils_1 = require("./utils");
const telemetry_1 = require("../services/telemetry");
class BaseQuickPickItem {
}
exports.BaseQuickPickItem = BaseQuickPickItem;
class WorkItemQueryQuickPickItem extends BaseQuickPickItem {
}
exports.WorkItemQueryQuickPickItem = WorkItemQueryQuickPickItem;
//Any changes to ButtonMessageItem must be reflected in IButtonMessageItem
class ButtonMessageItem {
}
exports.ButtonMessageItem = ButtonMessageItem;
class VsCodeUtils {
    //Returns the trimmed value if there's an activeTextEditor and a selection
    static GetActiveSelection() {
        const editor = vscode_1.window.activeTextEditor;
        if (!editor) {
            return undefined;
        }
        // Make sure that the selection is not empty and it is a single line
        const selection = editor.selection;
        if (selection.isEmpty || !selection.isSingleLine) {
            return undefined;
        }
        const range = new vscode_1.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character);
        const value = editor.document.getText(range).trim();
        return value;
    }
    static ShowErrorMessage(message, ...urlMessageItem) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.showMessage(message, constants_1.MessageTypes.Error, ...urlMessageItem);
        });
    }
    static ShowInfoMessage(message, ...urlMessageItem) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.showMessage(message, constants_1.MessageTypes.Info, ...urlMessageItem);
        });
    }
    static ShowWarningMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.showMessage(message, constants_1.MessageTypes.Warn);
        });
    }
    //We have a single method to display either simple messages (with no options) or messages
    //that have multiple buttons that can run commands, open URLs, send telemetry, etc.
    static showMessage(message, type, ...urlMessageItem) {
        return __awaiter(this, void 0, void 0, function* () {
            //The following "cast" allows us to pass our own type around (and not reference "vscode" via an import)
            const messageItems = urlMessageItem;
            const messageToDisplay = `(${constants_1.Constants.ExtensionName}) ${utils_1.Utils.FormatMessage(message)}`;
            //Use the typescript spread operator to pass the rest parameter to showErrorMessage
            let chosenItem;
            switch (type) {
                case constants_1.MessageTypes.Error:
                    chosenItem = yield vscode_1.window.showErrorMessage(messageToDisplay, ...messageItems);
                    break;
                case constants_1.MessageTypes.Info:
                    chosenItem = yield vscode_1.window.showInformationMessage(messageToDisplay, ...messageItems);
                    break;
                case constants_1.MessageTypes.Warn:
                    chosenItem = yield vscode_1.window.showWarningMessage(messageToDisplay, ...messageItems);
                    break;
                default:
                    break;
            }
            if (chosenItem) {
                if (chosenItem.url) {
                    utils_1.Utils.OpenUrl(chosenItem.url);
                }
                if (chosenItem.telemetryId) {
                    telemetry_1.Telemetry.SendEvent(chosenItem.telemetryId);
                }
                if (chosenItem.command) {
                    vscode_1.commands.executeCommand(chosenItem.command);
                }
            }
            return chosenItem;
        });
    }
}
exports.VsCodeUtils = VsCodeUtils;

//# sourceMappingURL=vscodeutils.js.map
