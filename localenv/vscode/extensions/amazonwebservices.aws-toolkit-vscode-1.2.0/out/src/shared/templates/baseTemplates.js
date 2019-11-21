"use strict";
/*!
 * Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
class BaseTemplates {
}
/* tslint:disable max-line-length */
BaseTemplates.SIMPLE_HTML = `
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-resource: https:; script-src vscode-resource: 'self' 'unsafe-eval'; style-src vscode-resource:;">
        </head>
            <body>
                <%= content %>
            </body>
        </html>`;
exports.BaseTemplates = BaseTemplates;
//# sourceMappingURL=baseTemplates.js.map