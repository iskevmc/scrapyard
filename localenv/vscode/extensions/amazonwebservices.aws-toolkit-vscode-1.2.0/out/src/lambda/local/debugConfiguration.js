"use strict";
/*!
 * Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
const codeLensUtils_1 = require("../../shared/codelens/codeLensUtils");
const DOTNET_CORE_DEBUGGER_PATH = '/tmp/lambci_debug_files/vsdbg';
function makeCoreCLRDebugConfiguration({ codeUri, port }) {
    const pipeArgs = ['-c', `docker exec -i $(docker ps -q -f publish=${port}) \${debuggerCommand}`];
    if (os.platform() === 'win32') {
        // Coerce drive letter to uppercase. While Windows is case-insensitive, sourceFileMap is case-sensitive.
        codeUri = codeUri.replace(codeLensUtils_1.DRIVE_LETTER_REGEX, match => match.toUpperCase());
    }
    return {
        name: 'SamLocalDebug',
        type: 'coreclr',
        request: 'attach',
        processId: '1',
        pipeTransport: {
            pipeProgram: 'sh',
            pipeArgs,
            debuggerPath: DOTNET_CORE_DEBUGGER_PATH,
            pipeCwd: codeUri
        },
        windows: {
            pipeTransport: {
                pipeProgram: 'powershell',
                pipeArgs,
                debuggerPath: DOTNET_CORE_DEBUGGER_PATH,
                pipeCwd: codeUri
            }
        },
        sourceFileMap: {
            ['/var/task']: codeUri
        }
    };
}
exports.makeCoreCLRDebugConfiguration = makeCoreCLRDebugConfiguration;
//# sourceMappingURL=debugConfiguration.js.map