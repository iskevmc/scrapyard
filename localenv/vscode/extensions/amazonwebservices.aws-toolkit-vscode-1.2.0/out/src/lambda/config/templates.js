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
// Use jsonc-parser.parse instead of JSON.parse, as JSONC can handle comments. VS Code uses jsonc-parser
// under the hood to provide symbols for JSON documents, so this will keep us consistent with VS code.
const jsonParser = require("jsonc-parser");
const os = require("os");
const _path = require("path");
const vscode = require("vscode");
const nls = require("vscode-nls");
const filesystem_1 = require("../../shared/filesystem");
const fsUtils = require("../../shared/filesystemUtilities");
const logger_1 = require("../../shared/logger");
const editorUtilities_1 = require("../../shared/utilities/editorUtilities");
const textDocumentUtilities_1 = require("../../shared/utilities/textDocumentUtilities");
const localize = nls.loadMessageBundle();
function generateDefaultHandlerConfig() {
    return {
        event: {},
        environmentVariables: {},
        dockerNetwork: undefined
    };
}
exports.generateDefaultHandlerConfig = generateDefaultHandlerConfig;
class DefaultLoadTemplatesConfigContext {
    constructor() {
        this.fileExists = fsUtils.fileExists;
        this.readFile = fsUtils.readFileAsString;
        this.saveDocumentIfDirty = textDocumentUtilities_1.saveDocumentIfDirty;
    }
}
exports.DefaultLoadTemplatesConfigContext = DefaultLoadTemplatesConfigContext;
function getTemplatesConfigPath(workspaceFolderPath) {
    return _path.join(workspaceFolderPath, '.aws', 'templates.json');
}
exports.getTemplatesConfigPath = getTemplatesConfigPath;
function load(workspaceFolderPath, context = new DefaultLoadTemplatesConfigContext()) {
    return __awaiter(this, void 0, void 0, function* () {
        const templatesConfigPath = getTemplatesConfigPath(workspaceFolderPath);
        return yield loadTemplatesConfig(templatesConfigPath, context);
    });
}
exports.load = load;
function loadTemplatesConfig(path, context = new DefaultLoadTemplatesConfigContext()) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield context.saveDocumentIfDirty(path);
            if (!(yield context.fileExists(path))) {
                return {
                    templates: {}
                };
            }
            const raw = yield context.readFile(path);
            return loadTemplatesConfigFromJson(raw);
        }
        catch (err) {
            if (Array.isArray(err) && err.length === 1) {
                err = err[0];
            }
            throw new Error(`Could not load .aws/templates.json: ${err}`);
        }
    });
}
function loadTemplatesConfigFromJson(json) {
    const errors = [];
    const config = jsonParser.parse(json, errors);
    if (errors.length > 0) {
        const message = errors.length === 1
            ? ` ${formatParseError(errors[0])}`
            : `${os.EOL}${errors.map(formatParseError).join(os.EOL)}`;
        throw new Error(`Could not parse .aws/templates.json:${message}`);
    }
    return config;
}
exports.loadTemplatesConfigFromJson = loadTemplatesConfigFromJson;
function showTemplatesConfigurationError(error, showErrorMessage = vscode.window.showErrorMessage) {
    const logger = logger_1.getLogger();
    showErrorMessage(localize('AWS.lambda.configure.error.fieldtype', 
    // tslint:disable-next-line:max-line-length
    'Your templates.json file has an issue. {0} was detected as {1} instead of one of the following: [{2}]. Please change or remove this field, and try again.', error.jsonPath.join('.'), error.actualType, error.expectedTypes.join(', ')));
    // tslint:disable-next-line:max-line-length
    logger.error(`Error detected in templates.json: ${error.message}. Field: ${error.jsonPath.join('.')}, expected one of: [${error.expectedTypes.join(', ')}], was: ${error.actualType}`);
}
exports.showTemplatesConfigurationError = showTemplatesConfigurationError;
function ensureTemplatesConfigFileExists(path) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield filesystem_1.access(_path.dirname(path));
        }
        catch (_a) {
            yield filesystem_1.mkdir(_path.dirname(path), { recursive: true });
        }
        try {
            yield filesystem_1.access(path);
        }
        catch (_b) {
            yield filesystem_1.writeFile(path, '{}');
        }
    });
}
exports.ensureTemplatesConfigFileExists = ensureTemplatesConfigFileExists;
function formatParseError(error) {
    return `${getParseErrorDescription(error.error)} at offset ${error.offset}, length ${error.length}`;
}
// Reverse enum mappings are only generated for non-const numerical enums,
// but ParseErrorCode is a const enum. So we have to reverse-map manually.
function getParseErrorDescription(code) {
    switch (code) {
        case 7 /* CloseBraceExpected */:
            return 'close brace expected';
        case 8 /* CloseBracketExpected */:
            return 'close bracket expected';
        case 5 /* ColonExpected */:
            return 'colon expected';
        case 6 /* CommaExpected */:
            return 'command expected';
        case 9 /* EndOfFileExpected */:
            return 'end of file expected';
        case 16 /* InvalidCharacter */:
            return 'invalid character';
        case 10 /* InvalidCommentToken */:
            return 'invalid comment token';
        case 15 /* InvalidEscapeCharacter */:
            return 'invalid escape character';
        case 2 /* InvalidNumberFormat */:
            return 'invalid number format';
        case 1 /* InvalidSymbol */:
            return 'invalid symbol';
        case 14 /* InvalidUnicode */:
            return 'invalid unicode';
        case 3 /* PropertyNameExpected */:
            return 'property name expected';
        case 11 /* UnexpectedEndOfComment */:
            return 'unexpected end of comment';
        case 13 /* UnexpectedEndOfNumber */:
            return 'unexpected end of number';
        case 12 /* UnexpectedEndOfString */:
            return 'unexpected end of string';
        case 4 /* ValueExpected */:
            return 'value expected';
        // By omitting the default case, we force the compiler to yell at us
        // if any enum members are added/removed/changed.
    }
}
class TemplatesConfigFieldTypeError extends Error {
    constructor(params) {
        super(params.message);
        this.jsonPath = params.jsonPath;
        this.expectedTypes = params.expectedTypes;
        this.actualType = params.actualType;
    }
}
exports.TemplatesConfigFieldTypeError = TemplatesConfigFieldTypeError;
class TemplatesConfigPopulator {
    constructor(json, modificationOptions = {
        formattingOptions: {
            insertSpaces: true,
            tabSize: editorUtilities_1.getTabSizeSetting()
        }
    }) {
        this.json = json;
        this.modificationOptions = modificationOptions;
        this.isDirty = false;
    }
    ensureTemplateSectionExists(templateRelativePath) {
        this.ensureTemplatesSectionExists();
        this.ensureJsonPropertyExists(['templates', templateRelativePath], {});
        return this;
    }
    ensureTemplateHandlerSectionExists(templateRelativePath, handler) {
        this.ensureTemplateHandlersSectionExists(templateRelativePath);
        this.ensureJsonPropertyExists(['templates', templateRelativePath, 'handlers', handler], {
            event: {},
            environmentVariables: {}
        });
        return this;
    }
    ensureTemplateHandlerPropertiesExist(templateRelativePath, handler) {
        this.ensureTemplateHandlerSectionExists(templateRelativePath, handler);
        this.ensureJsonPropertyExists(['templates', templateRelativePath, 'handlers', handler, 'event'], {});
        this.ensureJsonPropertyExists(['templates', templateRelativePath, 'handlers', handler, 'environmentVariables'], {});
        return this;
    }
    ensureTemplateParameterOverrideExists(templateRelativePath, parameterName) {
        this.ensureTemplateParameterOverridesSectionExists(templateRelativePath);
        this.ensureJsonPropertyExists(['templates', templateRelativePath, 'parameterOverrides', parameterName], '', [
            'string',
            'null'
        ]);
        return this;
    }
    getResults() {
        return {
            isDirty: this.isDirty,
            json: this.json
        };
    }
    ensureJsonPropertyExists(jsonPath, value, allowedTypes = ['object', 'null']) {
        const root = jsonParser.parseTree(this.json);
        const node = jsonParser.findNodeAtLocation(root, jsonPath);
        const allowedTypesSet = new Set(allowedTypes);
        if (node && !allowedTypesSet.has(node.type)) {
            throw new TemplatesConfigFieldTypeError({
                message: 'Invalid configuration',
                jsonPath: jsonPath,
                actualType: node.type,
                expectedTypes: allowedTypes
            });
        }
        if (!node || node.type === 'null') {
            const edits = jsonParser.modify(this.json, jsonPath, value, this.modificationOptions);
            if (edits.length > 0) {
                this.json = jsonParser.applyEdits(this.json, edits);
                this.isDirty = true;
            }
        }
    }
    ensureTemplatesSectionExists() {
        this.ensureJsonPropertyExists(['templates'], {});
        return this;
    }
    ensureTemplateHandlersSectionExists(templateRelativePath) {
        this.ensureTemplateSectionExists(templateRelativePath);
        this.ensureJsonPropertyExists(['templates', templateRelativePath, 'handlers'], {});
        return this;
    }
    ensureTemplateParameterOverridesSectionExists(templateRelativePath) {
        this.ensureTemplateSectionExists(templateRelativePath);
        this.ensureJsonPropertyExists(['templates', templateRelativePath, 'parameterOverrides'], {});
        return this;
    }
}
exports.TemplatesConfigPopulator = TemplatesConfigPopulator;
//# sourceMappingURL=templates.js.map