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
const vscode = require("vscode");
/**
 * Creates an InputBox to get a text response from the user.
 *
 * Used to wrap createInputBox and accommodate
 * a common set of features for the Toolkit.
 *
 * Parameters:
 *  options - initial InputBox configuration
 *  buttons - set of buttons to initialize the InputBox with
 * @return A new InputBox.
 */
function createInputBox({ options, buttons }) {
    const inputBox = vscode.window.createInputBox();
    if (options) {
        inputBox.title = options.title;
        inputBox.placeholder = options.placeHolder;
        inputBox.prompt = options.prompt;
        if (options.ignoreFocusOut !== undefined) {
            inputBox.ignoreFocusOut = options.ignoreFocusOut;
        }
        // TODO : Apply more options as they are needed in the future, and add corresponding tests
    }
    if (buttons) {
        inputBox.buttons = buttons;
    }
    return inputBox;
}
exports.createInputBox = createInputBox;
/**
 * Convenience method to allow the InputBox to be treated more like a dialog.
 *
 * This method shows the input box, and returns after the user enters a value, or cancels.
 * (Accepted = the user typed in a value and hit Enter, Cancelled = hide() is called or Esc is pressed)
 *
 * @param inputBox The InputBox to prompt the user with
 * @param onDidTriggerButton Optional event to trigger when the input box encounters a "Button Pressed" event.
 *  Buttons do not automatically cancel/accept the input box, caller must explicitly do this if intended.
 *
 * @returns If the InputBox was cancelled, undefined is returned. Otherwise, the string entered is returned.
 */
function promptUser({ inputBox, onValidateInput, onDidTriggerButton }) {
    return __awaiter(this, void 0, void 0, function* () {
        const disposables = [];
        try {
            const response = yield new Promise((resolve, reject) => {
                inputBox.onDidAccept(() => {
                    if (!inputBox.validationMessage) {
                        resolve(inputBox.value);
                    }
                }, inputBox, disposables);
                inputBox.onDidHide(() => {
                    resolve(undefined);
                }, inputBox, disposables);
                if (onValidateInput) {
                    inputBox.onDidChangeValue(value => {
                        inputBox.validationMessage = onValidateInput(value);
                    }, inputBox, disposables);
                }
                if (onDidTriggerButton) {
                    inputBox.onDidTriggerButton((btn) => onDidTriggerButton(btn, resolve, reject), inputBox, disposables);
                }
                inputBox.show();
            });
            return response;
        }
        finally {
            disposables.forEach(d => d.dispose());
            inputBox.hide();
        }
    });
}
exports.promptUser = promptUser;
//# sourceMappingURL=input.js.map