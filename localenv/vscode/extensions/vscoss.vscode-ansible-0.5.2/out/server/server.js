'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_1 = require("vscode-languageserver");
const yamlParser_1 = require("yaml-language-server/out/server/src/languageservice/parser/yamlParser");
const arrUtils_1 = require("yaml-language-server/out/server/src/languageservice/utils/arrUtils");
const uri_1 = require("yaml-language-server/out/server/src/languageservice/utils/uri");
const server_1 = require("yaml-language-server/out/server/src/server");
const yamlLanguageService_1 = require("./yamlLanguageService");
const request_light_1 = require("request-light");
const fs = require("fs-extra");
const path = require("path");
let connection = vscode_languageserver_1.createConnection();
let documents = new vscode_languageserver_1.TextDocuments();
documents.listen(connection);
let enableHover = true;
let enableValidation = true;
connection.onInitialize((params) => {
    let capabilities = params.capabilities;
    let workspaceFolders = params['workspaceFolders'];
    let workspaceRoot = params.rootPath;
    return {
        capabilities: {
            textDocumentSync: documents.syncKind,
            hoverProvider: true,
            documentSymbolProvider: true
        }
    };
});
connection.onDocumentSymbol((documentSymbolParms) => {
    let document = documents.get(documentSymbolParms.textDocument.uri);
    try {
        let jsonDocument = yamlParser_1.parse(document.getText());
        if (jsonDocument) {
            return exports.languageService.findDocumentSymbols(document, jsonDocument);
        }
    }
    catch (err) {
        //connection.console.log('Unable to parse Symbols: invalid yaml file.');
    }
});
connection.onHover((textDocumentPositionParams) => {
    let document = documents.get(textDocumentPositionParams.textDocument.uri);
    try {
        let jsonDocument = yamlParser_1.parse(document.getText());
        if (jsonDocument) {
            return exports.languageService.doHover(document, textDocumentPositionParams.position, jsonDocument);
        }
    }
    catch (err) {
        // connection.console.log('Unable to hover over: invalid yaml file.');
    }
});
connection.onDidChangeConfiguration((didChangeConfigurationParams) => {
    var clientSettings = didChangeConfigurationParams.settings;
    enableHover = clientSettings.ansible.hover;
    enableValidation = clientSettings.ansible.validation;
    updateConfiguration();
});
connection.listen();
let schemaRequestService = (uri) => {
    if (uri.startsWith('file://')) {
        let fsPath = uri;
        return new Promise((c, e) => {
            fs.readFile(fsPath, 'UTF-8', (err, result) => {
                err ? e('') : c(result.toString());
            });
        });
    }
    else if (uri.startsWith('vscode://')) {
        return connection.sendRequest(VSCodeContentRequest.type, uri).then(responseText => {
            return responseText;
        }, error => {
            return error.message;
        });
    }
    else {
        let scheme = uri_1.URI.parse(uri).scheme.toLowerCase();
        if (scheme !== 'http' && scheme !== 'https') {
            // custom scheme
            return connection.sendRequest(server_1.CustomSchemaContentRequest.type, uri);
        }
    }
    if (uri.indexOf('//schema.management.azure.com/') !== -1) {
        connection.telemetry.logEvent({
            key: 'json.schema',
            value: {
                schemaURL: uri
            }
        });
    }
    let headers = { 'Accept-Encoding': 'gzip, deflate' };
    return request_light_1.xhr({ url: uri, followRedirects: 5, headers }).then(response => {
        return response.responseText;
    }, (error) => {
        return null;
    });
};
let workspaceContext = {
    resolveRelativePath: (relativePath, resource) => {
        return path.resolve(resource, relativePath);
    }
};
exports.languageService = yamlLanguageService_1.getLanguageService(schemaRequestService, workspaceContext, {
    hover: enableHover,
    validation: enableValidation
});
function hasClientCapability(params, ...keys) {
    let c = params.capabilities;
    for (let i = 0; c && i < keys.length; i++) {
        c = c[keys[i]];
    }
    return !!c;
}
var VSCodeContentRequest;
(function (VSCodeContentRequest) {
    VSCodeContentRequest.type = new vscode_languageserver_1.RequestType('vscode/content');
})(VSCodeContentRequest || (VSCodeContentRequest = {}));
function updateConfiguration() {
    let clientSetting = {
        hover: enableHover,
        validation: enableValidation
    };
    let settings = {
        schemas: [],
        validate: enableValidation
    };
    exports.languageService.configure(settings, clientSetting);
    documents.all().forEach(triggerValidation);
}
documents.onDidChangeContent((textDocumentChangeEvent) => {
    try {
        triggerValidation(textDocumentChangeEvent.document);
    }
    catch (_a) {
    }
});
documents.onDidClose(textDocumentChangeEvent => {
    try {
        cleanPendingValidation(textDocumentChangeEvent.document);
        connection.sendDiagnostics({ uri: textDocumentChangeEvent.document.uri, diagnostics: [] });
    }
    catch (_a) {
    }
});
let pendingValidationRequests = {};
const validationDelayMs = 200;
function cleanPendingValidation(textDocument) {
    try {
        let request = pendingValidationRequests[textDocument.uri];
        if (request) {
            clearTimeout(request);
            delete pendingValidationRequests[textDocument.uri];
        }
    }
    catch (_a) {
    }
}
function triggerValidation(textDocument) {
    try {
        cleanPendingValidation(textDocument);
        pendingValidationRequests[textDocument.uri] = setTimeout(() => {
            delete pendingValidationRequests[textDocument.uri];
            validateTextDocument(textDocument);
        }, validationDelayMs);
    }
    catch (_a) {
    }
}
function validateTextDocument(textDocument) {
    if (!textDocument) {
        return;
    }
    if (textDocument.getText().length === 0) {
        return;
    }
    let yamlDocument = yamlParser_1.parse(textDocument.getText(), []);
    if (!yamlDocument) {
        return;
    }
    exports.languageService.doValidation(textDocument, yamlDocument).then((diagnosticResults) => {
        if (!diagnosticResults) {
            return;
        }
        let diagnostics = [];
        for (let diagnosticItem in diagnosticResults) {
            diagnosticResults[diagnosticItem].severity = 1; //Convert all warnings to errors
            diagnostics.push(diagnosticResults[diagnosticItem]);
        }
        connection.sendDiagnostics({ uri: textDocument.uri, diagnostics: arrUtils_1.removeDuplicatesObj(diagnostics) });
    }, (error) => { });
}
//# sourceMappingURL=server.js.map