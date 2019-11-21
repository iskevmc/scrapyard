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
const nls = require("vscode-nls");
const constants_1 = require("../../constants");
const samCliValidator_1 = require("./samCliValidator");
const localize = nls.loadMessageBundle();
// Messages
const RECOMMENDATION_UPDATE_TOOLKIT = localize('AWS.samcli.recommend.update.toolkit', 'Please check the Marketplace for an updated Toolkit.');
const RECOMMENDATION_UPDATE_SAM_CLI = localize('AWS.samcli.recommend.update.samcli', 'Please update your SAM CLI.');
const actionGoToSamCli = {
    label: localize('AWS.samcli.userChoice.visit.install.url', 'Get SAM CLI'),
    invoke: () => __awaiter(this, void 0, void 0, function* () {
        yield vscode.env.openExternal(vscode.Uri.parse(constants_1.samAboutInstallUrl));
    })
};
const actionGoToVsCodeMarketplace = {
    label: localize('AWS.samcli.userChoice.update.awstoolkit.url', 'Visit Marketplace'),
    invoke: () => __awaiter(this, void 0, void 0, function* () {
        // TODO : Switch to the Extension panel in VS Code instead
        yield vscode.env.openExternal(vscode.Uri.parse(constants_1.vscodeMarketplaceUrl));
    })
};
class DefaultSamCliValidationNotification {
    constructor(message, actions) {
        this.message = message;
        this.actions = actions;
    }
    show() {
        return __awaiter(this, void 0, void 0, function* () {
            const userResponse = yield vscode.window.showErrorMessage(this.message, ...this.actions.map(action => action.label));
            if (userResponse) {
                const responseActions = this.actions
                    .filter(action => action.label === userResponse)
                    .map((action) => __awaiter(this, void 0, void 0, function* () { return action.invoke(); }));
                yield Promise.all(responseActions);
            }
        });
    }
}
function notifySamCliValidation(samCliValidationError) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!samCliValidationError) {
            return;
        }
        const notification = makeSamCliValidationNotification(samCliValidationError);
        yield notification.show();
    });
}
exports.notifySamCliValidation = notifySamCliValidation;
function makeSamCliValidationNotification(samCliValidationError, onCreateNotification = (message, actions) => new DefaultSamCliValidationNotification(message, actions)) {
    if (samCliValidationError instanceof samCliValidator_1.SamCliNotFoundError) {
        return onCreateNotification(localize('AWS.samcli.notification.not.found', 'Unable to find SAM CLI. It is required in order to work with Serverless Applications locally.'), [actionGoToSamCli]);
    }
    else if (samCliValidationError instanceof samCliValidator_1.InvalidSamCliVersionError) {
        return onCreateNotification(makeVersionValidationNotificationMessage(samCliValidationError.versionValidation), makeVersionValidationActions(samCliValidationError.versionValidation.validation));
    }
    else {
        return onCreateNotification(localize('AWS.samcli.notification.unexpected.validation.issue', 'An unexpected issue occured while validating SAM CLI: {0}', samCliValidationError.message), []);
    }
}
exports.makeSamCliValidationNotification = makeSamCliValidationNotification;
function makeVersionValidationNotificationMessage(validationResult) {
    const recommendation = validationResult.validation === samCliValidator_1.SamCliVersionValidation.VersionTooHigh
        ? RECOMMENDATION_UPDATE_TOOLKIT
        : RECOMMENDATION_UPDATE_SAM_CLI;
    return localize('AWS.samcli.notification.version.invalid', 'Your SAM CLI version {0} does not meet requirements ({1}\u00a0\u2264\u00a0version\u00a0<\u00a0{2}). {3}', validationResult.version, samCliValidator_1.MINIMUM_SAM_CLI_VERSION_INCLUSIVE, samCliValidator_1.MAXIMUM_SAM_CLI_VERSION_EXCLUSIVE, recommendation);
}
function makeVersionValidationActions(validation) {
    const actions = [];
    if (validation === samCliValidator_1.SamCliVersionValidation.VersionTooHigh) {
        actions.push(actionGoToVsCodeMarketplace);
    }
    else {
        actions.push(actionGoToSamCli);
    }
    return actions;
}
//# sourceMappingURL=samCliValidationNotification.js.map