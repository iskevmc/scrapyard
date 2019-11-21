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
const _ = require("lodash");
const vscode = require("vscode");
const logger_1 = require("../../logger");
const baseTemplates_1 = require("../../templates/baseTemplates");
const errorTemplates_1 = require("./errorTemplates");
function showErrorDetails(element) {
    return __awaiter(this, void 0, void 0, function* () {
        const logger = logger_1.getLogger();
        const view = vscode.window.createWebviewPanel('html', `Error details for ${element.parent.label}`, vscode.ViewColumn.Active);
        try {
            const baseTemplateFn = _.template(baseTemplates_1.BaseTemplates.SIMPLE_HTML);
            view.webview.html = baseTemplateFn({ content: `<h1>${localize('AWS.message.loading', 'Loading...')}</h1>` });
            const showErrorDetailsTemplateFn = _.template(errorTemplates_1.ErrorTemplates.SHOW_ERROR_DETAILS);
            view.webview.html = baseTemplateFn({
                content: showErrorDetailsTemplateFn(element)
            });
        }
        catch (err) {
            const error = err;
            logger.error(error.message);
            const baseTemplateFn = _.template(baseTemplates_1.BaseTemplates.SIMPLE_HTML);
            view.webview.html = baseTemplateFn({ content: `Error displaying error details: ${error.message}` });
        }
    });
}
exports.showErrorDetails = showErrorDetails;
//# sourceMappingURL=showErrorDetails.js.map