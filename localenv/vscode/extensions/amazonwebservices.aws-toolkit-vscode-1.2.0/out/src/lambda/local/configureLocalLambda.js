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
const fsUtils = require("../../shared/filesystemUtilities");
const logger_1 = require("../../shared/logger");
const pathUtils_1 = require("../../shared/utilities/pathUtils");
const symbolUtilities_1 = require("../../shared/utilities/symbolUtilities");
const textDocumentUtilities_1 = require("../../shared/utilities/textDocumentUtilities");
const templates_1 = require("../config/templates");
class DefaultConfigureLocalLambdaContext {
    constructor() {
        this.showTextDocument = vscode.window.showTextDocument;
        this.executeCommand = vscode.commands.executeCommand;
        this.showErrorMessage = vscode.window.showErrorMessage;
    }
}
// Precondition: `handler` is a valid lambda handler name.
function configureLocalLambda(workspaceFolder, handler, samTemplate, context = new DefaultConfigureLocalLambdaContext()) {
    return __awaiter(this, void 0, void 0, function* () {
        const templateRelativePath = pathUtils_1.getNormalizedRelativePath(workspaceFolder.uri.fsPath, samTemplate.fsPath);
        const configPath = templates_1.getTemplatesConfigPath(workspaceFolder.uri.fsPath);
        yield templates_1.ensureTemplatesConfigFileExists(configPath);
        const configPathUri = vscode.Uri.file(configPath);
        const editor = yield context.showTextDocument(configPathUri);
        try {
            const configPopulationResult = new templates_1.TemplatesConfigPopulator(editor.document.getText(), {
                formattingOptions: {
                    insertSpaces: true,
                    tabSize: textDocumentUtilities_1.getTabSize(editor),
                    eol: editor.document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n'
                }
            })
                .ensureTemplateHandlerPropertiesExist(templateRelativePath, handler)
                .getResults();
            if (configPopulationResult.isDirty) {
                yield editor.edit(eb => {
                    eb.replace(new vscode.Range(editor.document.positionAt(0), editor.document.positionAt(editor.document.getText().length)), configPopulationResult.json);
                });
                // We don't save the doc. The user has the option to revert changes, or make further edits.
            }
            yield context.showTextDocument(editor.document, {
                selection: yield getEventRange(editor, templateRelativePath, handler, context)
            });
        }
        catch (e) {
            if (e instanceof templates_1.TemplatesConfigFieldTypeError) {
                templates_1.showTemplatesConfigurationError(e, context.showErrorMessage);
            }
            else {
                throw e;
            }
        }
    });
}
exports.configureLocalLambda = configureLocalLambda;
function getLocalLambdaConfiguration(workspaceFolder, handler, samTemplate) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const configPath = templates_1.getTemplatesConfigPath(workspaceFolder.uri.fsPath);
            const templateRelativePath = pathUtils_1.getNormalizedRelativePath(workspaceFolder.uri.fsPath, samTemplate.fsPath);
            yield textDocumentUtilities_1.saveDocumentIfDirty(configPath);
            let rawConfig = '{}';
            if (yield fsUtils.fileExists(configPath)) {
                rawConfig = yield fsUtils.readFileAsString(configPath);
            }
            const configPopulationResult = new templates_1.TemplatesConfigPopulator(rawConfig)
                .ensureTemplateHandlerSectionExists(templateRelativePath, handler)
                .getResults();
            const config = templates_1.loadTemplatesConfigFromJson(configPopulationResult.json);
            return config.templates[templateRelativePath].handlers[handler];
        }
        catch (e) {
            if (e instanceof templates_1.TemplatesConfigFieldTypeError) {
                templates_1.showTemplatesConfigurationError(e);
            }
            throw e;
        }
    });
}
exports.getLocalLambdaConfiguration = getLocalLambdaConfiguration;
function getEventRange(editor, relativeTemplatePath, handler, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const logger = logger_1.getLogger();
        const symbols = yield context.executeCommand('vscode.executeDocumentSymbolProvider', editor.document.uri);
        const defaultRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0));
        if (!symbols || symbols.length < 1) {
            return defaultRange;
        }
        const templatesSymbol = symbols.find(c => c.name === 'templates');
        if (!templatesSymbol) {
            logger.warn(`Invalid format for document ${editor.document.uri}`);
            return defaultRange;
        }
        const templateSymbol = templatesSymbol.children.find(c => c.name === relativeTemplatePath);
        if (!templateSymbol) {
            logger.warn(`Unable to find template section ${relativeTemplatePath} in ${editor.document.uri}`);
            return defaultRange;
        }
        const handlersSymbol = templateSymbol.children.find(c => c.name === 'handlers');
        if (!handlersSymbol) {
            logger.warn(`Unable to find handlers section for ${relativeTemplatePath} in ${editor.document.uri}`);
            return defaultRange;
        }
        const handlerSymbol = handlersSymbol.children.find(c => c.name === handler);
        if (!handlerSymbol) {
            logger.warn(`Unable to find config for handler ${handler}`);
            return defaultRange;
        }
        const eventSymbol = handlerSymbol.children.find(c => c.name === 'event');
        if (!eventSymbol) {
            return handlerSymbol.range;
        }
        return yield symbolUtilities_1.getChildrenRange(eventSymbol);
    });
}
//# sourceMappingURL=configureLocalLambda.js.map