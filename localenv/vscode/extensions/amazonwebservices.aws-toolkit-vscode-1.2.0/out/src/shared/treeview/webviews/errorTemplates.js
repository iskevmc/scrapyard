"use strict";
/*!
 * Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
const nls = require("vscode-nls");
const localize = nls.loadMessageBundle();
class ErrorTemplates {
}
ErrorTemplates.SHOW_ERROR_DETAILS = `
    <h1>
        ${localize('AWS.template.error.showErrorDetails.title', 'Error details for')} <%= parent.label %>
    </h1>
    <p>

    <h2>
        ${localize('AWS.template.error.showErrorDetails.errorCode', 'Error code')}
    </h2>
    <pre>
        <%= error.code %>
    </pre>

    <h2>
        ${localize('AWS.template.error.showErrorDetails.errorMessage', 'Error message')}
    </h2>
    <pre>
        <%= error.message %>
    </pre>
    `;
exports.ErrorTemplates = ErrorTemplates;
//# sourceMappingURL=errorTemplates.js.map