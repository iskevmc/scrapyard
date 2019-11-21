'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const yamlDocumentSymbol_1 = require("./services/yamlDocumentSymbol");
const yamlValidation_1 = require("yaml-language-server/out/server/src/languageservice/services/yamlValidation");
const jsonSchemaService_1 = require("yaml-language-server/out/server/src/languageservice/services/jsonSchemaService");
const configuration_1 = require("vscode-json-languageservice/lib/umd/services/configuration");
const yamlHover_1 = require("./services/yamlHover");
function getLanguageService(schemaRequestService, workspaceContext, clientSettings, promiseConstructor) {
    let promise = promiseConstructor || Promise;
    let jsonSchemaService = new jsonSchemaService_1.JSONSchemaService(schemaRequestService, workspaceContext, null);
    jsonSchemaService.setSchemaContributions(configuration_1.schemaContributions);
    let hover = new yamlHover_1.YAMLHover(promise);
    let documentSymbol = new yamlDocumentSymbol_1.YamlDocumentSymbols();
    let yamlvalidation = new yamlValidation_1.YAMLValidation(jsonSchemaService, promise);
    let languagesettings = {
        validate: clientSettings.validation
    };
    yamlvalidation.configure(languagesettings);
    return {
        configure: (settings, clientSettings) => {
            jsonSchemaService.clearExternalSchemas();
            if (settings.schemas) {
                settings.schemas.forEach(settings => {
                    jsonSchemaService.registerExternalSchema(settings.uri, settings.fileMatch, settings.schema);
                });
            }
            hover.configure(clientSettings.hover);
            settings.validate = clientSettings.validation;
            yamlvalidation.configure(settings);
        },
        doValidation: yamlvalidation.doValidation.bind(yamlvalidation),
        findDocumentSymbols: documentSymbol.findDocumentSymbols.bind(documentSymbol),
        doHover: hover.doHover.bind(hover)
    };
}
exports.getLanguageService = getLanguageService;
;
//# sourceMappingURL=yamlLanguageService.js.map