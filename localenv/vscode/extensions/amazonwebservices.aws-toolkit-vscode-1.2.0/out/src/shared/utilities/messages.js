/*!
 * Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const nls = require("vscode-nls");
const localize = nls.loadMessageBundle();
function makeCheckLogsMessage() {
    const commandName = localize('AWS.command.viewLogs', 'View AWS Toolkit Logs');
    const message = localize('AWS.error.check.logs', 'Check the logs for more information by running the "{0}" command from the Command Palette.', commandName);
    return message;
}
exports.makeCheckLogsMessage = makeCheckLogsMessage;
//# sourceMappingURL=messages.js.map