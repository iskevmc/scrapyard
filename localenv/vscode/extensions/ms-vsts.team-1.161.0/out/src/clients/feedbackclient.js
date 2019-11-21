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
const logger_1 = require("../helpers/logger");
const constants_1 = require("../helpers/constants");
const strings_1 = require("../helpers/strings");
const utils_1 = require("../helpers/utils");
const telemetry_1 = require("../services/telemetry");
class FeedbackClient {
    //This feedback will go no matter whether Application Insights is enabled or not.
    static SendFeedback() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const choices = [];
                choices.push({ label: strings_1.Strings.SendASmile, description: undefined, id: constants_1.TelemetryEvents.SendASmile });
                choices.push({ label: strings_1.Strings.SendAFrown, description: undefined, id: constants_1.TelemetryEvents.SendAFrown });
                const choice = yield vscode_1.window.showQuickPick(choices, { matchOnDescription: false, placeHolder: strings_1.Strings.SendFeedback });
                if (choice) {
                    const value = yield vscode_1.window.showInputBox({ value: undefined, prompt: strings_1.Strings.SendFeedbackPrompt, placeHolder: undefined, password: false });
                    if (value === undefined) {
                        const disposable = vscode_1.window.setStatusBarMessage(strings_1.Strings.NoFeedbackSent);
                        setTimeout(() => disposable.dispose(), 1000 * 5);
                        return;
                    }
                    //This feedback will go no matter whether Application Insights is enabled or not.
                    let trimmedValue = value.trim();
                    if (trimmedValue.length > 1000) {
                        trimmedValue = trimmedValue.substring(0, 1000);
                    }
                    telemetry_1.Telemetry.SendFeedback(choice.id, { "VSCode.Feedback.Comment": trimmedValue });
                    const disposable = vscode_1.window.setStatusBarMessage(strings_1.Strings.ThanksForFeedback);
                    setTimeout(() => disposable.dispose(), 1000 * 5);
                }
            }
            catch (err) {
                const message = utils_1.Utils.GetMessageForStatusCode(0, err.message, "Failed getting SendFeedback selection");
                logger_1.Logger.LogError(message);
                telemetry_1.Telemetry.SendException(err);
            }
        });
    }
}
exports.FeedbackClient = FeedbackClient;

//# sourceMappingURL=feedbackclient.js.map
