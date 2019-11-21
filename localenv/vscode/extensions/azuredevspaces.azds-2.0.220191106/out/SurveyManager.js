// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// ----------------------------------------------------------------------------
'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const glob = require("glob-promise");
const moment = require("moment");
const osenv = require("osenv");
const util = require("util");
const vscode = require("vscode");
const PromptItem_1 = require("./PromptItem");
const TelemetryEvent_1 = require("./logger/TelemetryEvent");
const ThenableUtility_1 = require("./utility/ThenableUtility");
const existsAsync = util.promisify(fs.exists);
const statAsync = util.promisify(fs.stat);
class SurveyManager extends vscode.Disposable {
    constructor(context, logger, azureCliClient) {
        super(() => this.dispose());
        this.PanelViewType = `azdsSurvey`;
        this.SurveyIdentifier = `survey2019-2`;
        this.SurveyDisabledIdentitifier = `survey2019Disabled`;
        this.SurveyExtensionLastInstallDate = `surveyExtensionLastInstallDate`;
        // TODO: Move the HTML to a separate file.
        this._surveyHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    background: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    padding: 5px 30px;
                }

                .question {
                    margin-top: 25px;
                    margin-bottom: 25px;
                }

                .question > .title {
                    font-size: 1.05em;
                    font-weight: 600;
                    margin-bottom: 10px;
                }

                input[type=radio], label {
                    cursor: pointer;
                    margin-bottom: 8px;
                }

                .userDetails {
                    margin-top: 10px;
                }

                body.vscode-dark input[type="radio"]:checked+label {
                    color: #79b1ff;
                }

                body.vscode-light input[type="radio"]:checked+label {
                    color: #034db3;
                }
                
                body.vscode-high-contrast input[type="radio"]:checked+label {
                    color: #ffe201;
                }

                .submitButton {
                    background: #034db3;
                    color: #ffffff;
                    border: none;
                    padding: 8px 15px;
                    font-size: 1em;
                    cursor: pointer;
                }

                body.vscode-high-contrast .submitButton {
                    background: #ffe201;
                    color: #000000;
                }

                .submitButton:disabled,
                body.vscode-high-contrast .submitButton:disabled {
                    background: #999999;
                    color: #555555;
                    cursor: default;
                }
            </style>
            <script>
                function submitSurvey() {
                    const surveyResult = {
                        installReason: document.querySelector("input[name='installReason']:checked").value,
                        interestingScenario: document.querySelector("input[name='scenarioInterest']:checked").value
                    };

                    const vscode = acquireVsCodeApi();
                    vscode.postMessage(surveyResult);
                }

                function enableSubmitButtonIfPossible() {
                    const isInstallReasonOptionSelected = document.querySelector("input[name='installReason']:checked") != null;
                    const isScenarioInterestOptionSelected = document.querySelector("input[name='scenarioInterest']:checked") != null;
                    if (isInstallReasonOptionSelected && isScenarioInterestOptionSelected) {
                        document.getElementById("submitButton").disabled = false;
                    }
                }

                function shuffleInPlace(options) {
                    for (let i = options.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [options[i], options[j]] = [options[j], options[i]];
                    }
                }

                function createShuffledOptions(name, options, containerId) {
                    shuffleInPlace(options);
                    const container = document.getElementById(containerId);
                    for (let i = 0; i < options.length; i++) {
                        const answer = document.createElement("div");
                        const radio = document.createElement("input");
                        radio.type = "radio";
                        radio.id = name + i;
                        radio.name = name;
                        radio.value = options[i];
                        radio.onclick = enableSubmitButtonIfPossible;
                        answer.appendChild(radio);

                        const label = document.createElement("label");
                        label.htmlFor = name + i;
                        label.innerText = options[i];
                        answer.appendChild(label);

                        container.insertBefore(answer, container.firstChild);
                    }
                }

                function initialize() {
                    const installReasonOptions = [
                        "I didn't even know it was installed",
                        "It was a Visual Studio Code recommendation",
                        "Remote debugging in Kubernetes",
                        "Easily configuring my project for Kubernetes"];
                    createShuffledOptions("installReason", installReasonOptions, "installReasonOptions");

                    const scenarioInterestOptions = [
                        "Help me understand what Azure Dev Spaces is",
                        "Create and view dev spaces for managing isolated development in an AKS cluster",
                        "View services currently running in dev spaces",
                        "Integration with the Microsoft Kubernetes extension for cluster management, viewing pod status, logs, etc.",
                        "Set up an automated deployment pipeline, deploying to dev spaces whenever source is committed"];
                    createShuffledOptions("scenarioInterest", scenarioInterestOptions, "scenarioInterestOptions");

                    window.addEventListener("message", event => {
                        const message = event.data;
                        const subscriptionId = message.subscriptionId;
                        const shareMoreLinks = document.getElementsByClassName("shareMoreLink");
                        for (const shareMoreLink of shareMoreLinks) {
                            shareMoreLink.href = "https://aka.ms/azds-survey-monkey?context=vscode&subscriptionId=" + subscriptionId;
                        }
                    });
                }
            </script>
        </head>
        <body onload="initialize()">
            <h2>Azure Dev Spaces feedback</h2>
            <h3>The engineering team needs your help to improve our product.</h3>

            <div class="question">
                <div class="title">1. Why did you install the Azure Dev Spaces extension? (Required)</div>
                <div id="installReasonOptions">
                    <div>
                        <input type="radio" id="otherInstallReasonOption" name="installReason" value="Other" onclick="enableSubmitButtonIfPossible()" />
                        <label for="otherInstallReasonOption">Other: </label>
                        <a class="shareMoreLink" href="https://aka.ms/azds-survey-monkey?context=vscode" target="_blank">please specify</a>
                    </div>
                </div>
            </div>

            <div class="question">
                <div class="title">2. What scenarios would you like to see covered in our extension next? (Required)</div>
                <div id="scenarioInterestOptions">
                    <div>
                        <input type="radio" id="otherScenarioInterestOption" name="scenarioInterest" value="Other" onclick="enableSubmitButtonIfPossible()" />
                        <label for="otherScenarioInterestOption">Other: </label>
                        <a class="shareMoreLink" href="https://aka.ms/azds-survey-monkey?context=vscode" target="_blank">please specify</a>
                    </div>
                </div>
            </div>

            <div class="question">
                <div class="title">3. Would you be willing to share more with us about your experience with Azure Dev Spaces so far? (Optional)</div>
                <p>Adding extra details is optional but would help us a lot. Don't forget to click the "Submit Feedback" button once you opened the external link.</p>
                <a class="shareMoreLink" href="https://aka.ms/azds-survey-monkey?context=vscode" target="_blank">Share more information</a>
            </div>

            <button id="submitButton" class="submitButton" onclick="submitSurvey()" disabled>Submit Feedback</button>
        </body>
        </html>`;
        this._context = context;
        this._logger = logger;
        this._azureCliClient = azureCliClient;
        this._disposables = [];
    }
    showIfNeededAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            const isSurveyDisabled = this._context.globalState.get(this.SurveyDisabledIdentitifier, /*defaultValue*/ false);
            if (isSurveyDisabled) {
                // User already took the survey or dismissed the survey information message. No need to show it again.
                return;
            }
            // Check if the survey should be showed based on the installation time.
            const extensionLatestKnownInstallDate = yield this.getExtensionLatestKnownInstallDateAsync();
            const previousInstallDate = this._context.globalState.get(this.SurveyExtensionLastInstallDate, extensionLatestKnownInstallDate);
            this._context.globalState.update(this.SurveyExtensionLastInstallDate, previousInstallDate); // quick access to the installation date instead of calculating
            const minInstallDate = new Date();
            minInstallDate.setDate(minInstallDate.getDate() - 30); // Minimum installation time to show the survey popup
            if (moment(minInstallDate).diff(moment(previousInstallDate)) < 0) {
                return; // Minimum installation date is not met
            }
            // We're about to show the survey information message. Whatever happens next, we're never going to show this again to the user.
            this._context.globalState.update(this.SurveyDisabledIdentitifier, true);
            let defaultSubscriptionId;
            try {
                defaultSubscriptionId = yield this._azureCliClient.getDefaultSubscriptionIdAsync();
            }
            catch (error) {
                // There isn't much more we can do if we couldn't retrieve the default subscription id.
                defaultSubscriptionId = ``;
            }
            this._logger.trace(TelemetryEvent_1.TelemetryEvent.SurveyInformationMessageShown, {
                identifier: this.SurveyIdentifier
            });
            const yesItem = { title: `Yes`, result: PromptItem_1.PromptResult.Yes };
            const noItem = { title: `No`, result: PromptItem_1.PromptResult.No };
            const promptItem = yield ThenableUtility_1.ThenableUtility.ToPromise(vscode.window.showInformationMessage(`The Azure Dev Spaces team would love to hear from you! Would you mind taking a minute to answer a couple questions?`, yesItem, noItem));
            if (promptItem == null || promptItem.result != PromptItem_1.PromptResult.Yes) {
                return;
            }
            this._panel = vscode.window.createWebviewPanel(this.PanelViewType, 
            /*title*/ `Azure Dev Spaces feedback`, vscode.ViewColumn.One, { enableScripts: true });
            this._panel.onDidDispose(() => this.dispose(), /*thisArgs*/ null, this._disposables);
            this._panel.webview.onDidReceiveMessage(message => this.onSurveyMessageReceived(message), /*thisArgs*/ null, this._disposables);
            this._panel.webview.html = this._surveyHtml;
            this._panel.webview.postMessage({ subscriptionId: defaultSubscriptionId });
            this._logger.trace(TelemetryEvent_1.TelemetryEvent.SurveyShown, {
                identifier: this.SurveyIdentifier
            });
        });
    }
    dispose() {
        this._panel.dispose();
        this._disposables.forEach((disposable) => disposable.dispose());
    }
    onSurveyMessageReceived(message) {
        // Close the webview.
        this._panel.dispose();
        this._logger.trace(TelemetryEvent_1.TelemetryEvent.SurveyAnswerCore, {
            identifier: this.SurveyIdentifier,
            installReason: message[`installReason`],
            interestingScenario: message[`interestingScenario`]
        });
        vscode.window.showInformationMessage(`Thank you for providing your feedback to the Azure Dev Spaces team!`);
    }
    getExtensionLatestKnownInstallDateAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            const installPath = `${osenv.home()}/.vscode/extensions/`;
            if (!(yield existsAsync(installPath))) {
                return new Date();
            }
            const extensionFolders = glob.sync(`${installPath}azuredevspaces.azds-*`);
            if (!extensionFolders || extensionFolders.length < 1) {
                return new Date();
            }
            let lastInstalledDate = moment(new Date());
            for (const folder of extensionFolders) {
                const folderStatus = yield statAsync(folder);
                const installDate = moment(new Date(folderStatus.mtime));
                if (installDate.diff(lastInstalledDate) < 0) {
                    lastInstalledDate = installDate;
                }
            }
            return lastInstalledDate.toDate();
        });
    }
}
exports.SurveyManager = SurveyManager;
//# sourceMappingURL=SurveyManager.js.map