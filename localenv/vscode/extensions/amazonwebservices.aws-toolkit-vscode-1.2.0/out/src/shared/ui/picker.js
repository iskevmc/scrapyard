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
const logger_1 = require("../logger");
/**
 * Creates a QuickPick to let the user pick an item from a list
 * of items of type T.
 *
 * Used to wrap createQuickPick and accommodate
 * a common set of features for the Toolkit.
 *
 * Parameters:
 *  options - initial picker configuration
 *  items - set of selectable vscode.QuickPickItem based items to initialize the picker with
 *  buttons - set of buttons to initialize the picker with
 * @return A new QuickPick.
 */
function createQuickPick({ options, items, buttons }) {
    const picker = vscode.window.createQuickPick();
    if (options) {
        picker.title = options.title;
        picker.placeholder = options.placeHolder;
        picker.value = options.value || '';
        if (options.matchOnDescription !== undefined) {
            picker.matchOnDescription = options.matchOnDescription;
        }
        if (options.matchOnDetail !== undefined) {
            picker.matchOnDetail = options.matchOnDetail;
        }
        if (options.ignoreFocusOut !== undefined) {
            picker.ignoreFocusOut = options.ignoreFocusOut;
        }
        // TODO : Apply more options as they are needed in the future, and add corresponding tests
    }
    if (items) {
        picker.items = items;
    }
    if (buttons) {
        picker.buttons = buttons;
    }
    return picker;
}
exports.createQuickPick = createQuickPick;
/**
 * Convenience method to allow the QuickPick to be treated more like a dialog.
 *
 * This method shows the picker, and returns after the picker is either accepted or cancelled.
 * (Accepted = the user accepted selected values, Cancelled = hide() is called or Esc is pressed)
 *
 * @param picker The picker to prompt the user with
 * @param onDidTriggerButton Optional event to trigger when the picker encounters a "Button Pressed" event.
 *  Buttons do not automatically cancel/accept the picker, caller must explicitly do this if intended.
 *
 * @returns If the picker was cancelled, undefined is returned. Otherwise, an array of the selected items is returned.
 */
function promptUser({ picker, onDidTriggerButton }) {
    return __awaiter(this, void 0, void 0, function* () {
        const disposables = [];
        try {
            const response = yield new Promise((resolve, reject) => {
                picker.onDidAccept(() => {
                    resolve(Array.from(picker.selectedItems));
                }, picker, disposables);
                picker.onDidHide(() => {
                    resolve(undefined);
                }, picker, disposables);
                if (onDidTriggerButton) {
                    picker.onDidTriggerButton((btn) => onDidTriggerButton(btn, resolve, reject), picker, disposables);
                }
                picker.show();
            });
            return response;
        }
        finally {
            disposables.forEach(d => d.dispose());
            picker.hide();
        }
    });
}
exports.promptUser = promptUser;
function verifySinglePickerOutput(choices) {
    const logger = logger_1.getLogger();
    if (!choices || choices.length === 0) {
        return undefined;
    }
    if (choices.length > 1) {
        logger.warn(`Received ${choices.length} responses from user, expected 1.` +
            ' Cancelling to prevent deployment of unexpected template.');
        return undefined;
    }
    return choices[0];
}
exports.verifySinglePickerOutput = verifySinglePickerOutput;
//# sourceMappingURL=picker.js.map