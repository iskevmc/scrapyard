#!/usr/bin/env node
/*
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License").
You may not use this file except in compliance with the License.
A copy of the License is located at

    http://www.apache.org/licenses/LICENSE-2.0

or in the "license" file accompanying this file. This file is distributed
on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
express or implied. See the License for the specific language governing
permissions and limitations under the License.
*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const vscode_languageserver_1 = require("vscode-languageserver");
const vscode_uri_1 = require("vscode-uri");
const child_process_1 = require("child_process");
const program = new commander_1.Command('cfn-lsp')
    .allowUnknownOption()
    .version(require('../../package.json').version)
    .option('--stdio', 'use stdio')
    .option('--node-ipc', 'use node-ipc')
    .parse(process.argv);
var connection;
if (program.stdio) {
    connection = vscode_languageserver_1.createConnection(process.stdin, process.stdout);
}
else {
    connection = vscode_languageserver_1.createConnection(new vscode_languageserver_1.IPCMessageReader(process), new vscode_languageserver_1.IPCMessageWriter(process));
}
// Create a simple text document manager. The text document manager
// supports full document sync only
let documents = new vscode_languageserver_1.TextDocuments();
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);
// After the server has started the client sends an initialize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilities.
let workspaceRoot;
connection.onInitialize((params) => {
    workspaceRoot = params.rootPath;
    return {
        capabilities: {
            // Tell the client that the server works in FULL text document sync mode
            textDocumentSync: documents.syncKind
        }
    };
});
// The content of a CloudFormation document has saved. This event is emitted
// when the document get saved
documents.onDidSave((event) => {
    runLinter(event.document);
});
documents.onDidOpen((event) => {
    runLinter(event.document);
});
documents.onDidClose((event) => {
    connection.sendNotification('cfn/fileclosed', event.document.uri);
});
connection.onNotification('cfn/requestPreview', (uri) => {
    connection.console.log('preview requested: ' + uri);
    isPreviewing[uri] = true;
    runLinter(documents.get(uri));
});
connection.onNotification('cfn/previewClosed', (uri) => {
    connection.console.log('preview closed: ' + uri);
    isPreviewing[uri] = false;
});
// hold the Settings
let Path;
let AppendRules;
let IgnoreRules;
let OverrideSpecPath;
// The settings have changed. Is send on server activation as well.
connection.onDidChangeConfiguration((change) => {
    connection.console.log('Settings have been updated...');
    let settings = change.settings;
    connection.console.log('Settings: ' + JSON.stringify(settings));
    Path = settings.cfnLint.path || 'cfn-lint';
    IgnoreRules = settings.cfnLint.ignoreRules;
    OverrideSpecPath = settings.cfnLint.overrideSpecPath;
    AppendRules = settings.cfnLint.appendRules;
    // Revalidate any open text documents
    documents.all().forEach(runLinter);
});
let isRunningLinterOn = {};
let isPreviewing = {};
function convertSeverity(mistakeType) {
    switch (mistakeType) {
        case "Warning":
            return vscode_languageserver_1.DiagnosticSeverity.Warning;
        case "Informational":
            return vscode_languageserver_1.DiagnosticSeverity.Information;
        case "Hint":
            return vscode_languageserver_1.DiagnosticSeverity.Hint;
    }
    return vscode_languageserver_1.DiagnosticSeverity.Error;
}
function isCloudFormation(template, filename) {
    if (/"?AWSTemplateFormatVersion"?\s*/.exec(template)) {
        connection.console.log("Determined this file is a CloudFormation Template. " + filename +
            ". Found the string AWSTemplateFormatVersion");
        return true;
    }
    if (/\n?"?Resources"?\s*:/.exec(template)) {
        if (/"?Type"?\s*:\s*"?'?(AWS|Alexa|Custom)::/.exec(template)) {
            // filter out serverless.io templates
            if (!(/\nresources:/.exec(template) && /\nprovider:/.exec(template))) {
                connection.console.log("Determined this file is a CloudFormation Template. " + filename +
                    ". Found 'Resources' and 'Type: (AWS|Alexa|Custom)::'");
                return true;
            }
        }
    }
    return false;
}
function runLinter(document) {
    let uri = document.uri;
    if (isRunningLinterOn[uri]) {
        connection.sendNotification('cfn/busy');
        return;
    }
    let file_to_lint = vscode_uri_1.URI.parse(uri).fsPath;
    let is_cfn = isCloudFormation(document.getText(), uri.toString());
    connection.sendNotification('cfn/isPreviewable', is_cfn);
    let build_graph = isPreviewing[uri];
    if (is_cfn) {
        let args = ['--format', 'json'];
        if (build_graph) {
            args.push('--build-graph');
        }
        if (IgnoreRules.length > 0) {
            for (var ignoreRule of IgnoreRules) {
                args.push('--ignore-checks');
                args.push(ignoreRule);
            }
        }
        if (AppendRules.length > 0) {
            for (var appendRule of AppendRules) {
                args.push('--append-rules');
                args.push(appendRule);
            }
        }
        if (OverrideSpecPath !== "") {
            args.push('--override-spec', OverrideSpecPath);
        }
        args.push('--', `"${file_to_lint}"`);
        connection.console.log(`Running... ${Path} ${args}`);
        isRunningLinterOn[uri] = true;
        let child = child_process_1.spawn(Path, args, {
            cwd: workspaceRoot,
            shell: true
        });
        let diagnostics = [];
        let filename = uri.toString();
        let start = 0;
        let end = Number.MAX_VALUE;
        child.on('error', function (err) {
            let errorMessage = `Unable to start cfn-lint (${err}). Is cfn-lint installed correctly?`;
            connection.console.log(errorMessage);
            let lineNumber = 0;
            let diagnostic = {
                range: {
                    start: { line: lineNumber, character: start },
                    end: { line: lineNumber, character: end }
                },
                severity: vscode_languageserver_1.DiagnosticSeverity.Error,
                message: '[cfn-lint] ' + errorMessage
            };
            diagnostics.push(diagnostic);
            return;
        });
        child.stderr.on("data", (data) => {
            let err = data.toString();
            connection.console.log(err);
            let lineNumber = 0;
            let diagnostic = {
                range: {
                    start: { line: lineNumber, character: start },
                    end: { line: lineNumber, character: end }
                },
                severity: vscode_languageserver_1.DiagnosticSeverity.Warning,
                message: '[cfn-lint] ' + err + '\nGo to https://github.com/aws-cloudformation/cfn-python-lint/#install for more help'
            };
            diagnostics.push(diagnostic);
            return;
        });
        let stdout = "";
        child.stdout.on("data", (data) => {
            stdout = stdout.concat(data.toString());
        });
        child.on('exit', function (code, signal) {
            connection.console.log('child process exited with ' +
                `code ${code} and signal ${signal}`);
            let tmp = stdout.toString();
            let obj;
            try {
                obj = JSON.parse(tmp);
            }
            catch (err) {
                let lineNumber = 0;
                let diagnostic = {
                    range: {
                        start: { line: lineNumber, character: start },
                        end: { line: lineNumber, character: end }
                    },
                    severity: vscode_languageserver_1.DiagnosticSeverity.Warning,
                    message: '[cfn-lint] ' + err + '\nGo to https://github.com/aws-cloudformation/cfn-python-lint/#install for more help'
                };
                diagnostics.push(diagnostic);
                return;
            }
            for (let element of obj) {
                let lineNumber = (Number.parseInt(element.Location.Start.LineNumber) - 1);
                let columnNumber = (Number.parseInt(element.Location.Start.ColumnNumber) - 1);
                let lineNumberEnd = (Number.parseInt(element.Location.End.LineNumber) - 1);
                let columnNumberEnd = (Number.parseInt(element.Location.End.ColumnNumber) - 1);
                let diagnostic = {
                    range: {
                        start: { line: lineNumber, character: columnNumber },
                        end: { line: lineNumberEnd, character: columnNumberEnd }
                    },
                    severity: convertSeverity(element.Level),
                    message: '[cfn-lint] ' + element.Rule.Id + ': ' + element.Message
                };
                diagnostics.push(diagnostic);
            }
            ;
        });
        child.on("close", () => {
            //connection.console.log(`Validation finished for(code:${code}): ${Files.uriToFilePath(uri)}`);
            connection.sendDiagnostics({ uri: filename, diagnostics });
            isRunningLinterOn[uri] = false;
            if (build_graph) {
                connection.console.log('preview file is available');
                connection.sendNotification('cfn/previewIsAvailable', uri);
            }
        });
    }
    else {
        connection.console.log("Don't believe this is a CloudFormation template. " + uri.toString() +
            ". If it is please add AWSTemplateFormatVersion: '2010-09-09' (YAML) or " +
            " \"AWSTemplateFormatVersion\": \"2010-09-09\" (JSON) into the root level of the document.");
    }
}
// Listen on the connection
connection.listen();
//# sourceMappingURL=server.js.map