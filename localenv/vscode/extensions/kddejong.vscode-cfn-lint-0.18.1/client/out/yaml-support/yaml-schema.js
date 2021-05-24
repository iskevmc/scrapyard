"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerYamlSchemaSupport = void 0;
const semver = require("semver");
const vscode_uri_1 = require("vscode-uri");
const vscode = require("vscode");
const yaml_locator_1 = require("./yaml-locator");
const yaml_constant_1 = require("./yaml-constant");
const util = require("./yaml-util");
const yaml_constant_2 = require("./yaml-constant");
const schema_holder_1 = require("./schema-holder");
let schema = new schema_holder_1.CloudFormationSchemaHolder();
function registerYamlSchemaSupport() {
    return __awaiter(this, void 0, void 0, function* () {
        schema.loadSchemaFromRaw();
        const yamlPlugin = yield activateYamlExtension();
        if (!yamlPlugin || !yamlPlugin.registerContributor) {
            // activateYamlExtension has already alerted to users for errors.
            return;
        }
        // register for cloudformation schema provider
        yamlPlugin.registerContributor(yaml_constant_1.CLOUDFORMATION_SCHEMA, requestYamlSchemaUriCallback, requestYamlSchemaContentCallback);
    });
}
exports.registerYamlSchemaSupport = registerYamlSchemaSupport;
// see docs from YamlSchemaContributor
function requestYamlSchemaUriCallback(resource) {
    const textEditor = vscode.window.visibleTextEditors.find((editor) => editor.document.uri.toString() === resource);
    if (textEditor) {
        const yamlDocs = yaml_locator_1.yamlLocator.getYamlDocuments(textEditor.document);
        var found = false;
        yamlDocs.forEach((doc) => {
            // if the yaml document contains AWSTemplateFormatVersion or Resources at the main level it will
            // register as CloudFormation
            const topLevelMapping = doc.nodes.find((node) => node.kind === 'MAPPING');
            if (topLevelMapping) {
                // if the overall yaml is an map, find the apiVersion and kind properties in yaml
                const cfnTemplateVersion = util.getYamlMappingValue(topLevelMapping, 'AWSTemplateFormatVersion');
                const cfnResources = util.getYamlMappingNode(topLevelMapping, 'Resources');
                if (cfnTemplateVersion || cfnResources) {
                    found = true;
                }
            }
        });
        if (found) {
            return yaml_constant_2.CLOUDFORMATION_SCHEMA_PREFIX + 'cloudformation';
        }
    }
    return undefined;
}
// see docs from YamlSchemaContributor
function requestYamlSchemaContentCallback(uri) {
    const parsedUri = vscode_uri_1.default.parse(uri);
    if (parsedUri.scheme !== yaml_constant_1.CLOUDFORMATION_SCHEMA) {
        return undefined;
    }
    if (!parsedUri.path || !parsedUri.path.startsWith('/')) {
        return undefined;
    }
    return JSON.stringify(schema.schema);
}
// find redhat.vscode-yaml extension and try to activate it to get the yaml contributor
function activateYamlExtension() {
    return __awaiter(this, void 0, void 0, function* () {
        const ext = vscode.extensions.getExtension(yaml_constant_1.VSCODE_YAML_EXTENSION_ID);
        if (!ext) {
            vscode.window.showWarningMessage('Please install \'YAML Support by Red Hat\' via the Extensions pane.');
            return undefined;
        }
        const yamlPlugin = yield ext.activate();
        if (!yamlPlugin || !yamlPlugin.registerContributor) {
            vscode.window.showWarningMessage('The installed Red Hat YAML extension doesn\'t support Registering Contributers. Please upgrade \'YAML Support by Red Hat\' via the Extensions pane.');
            return undefined;
        }
        if (ext.packageJSON.version && !semver.gte(ext.packageJSON.version, '0.0.15')) {
            vscode.window.showWarningMessage('The installed Red Hat YAML extension doesn\'t support multiple schemas. Please upgrade \'YAML Support by Red Hat\' via the Extensions pane.');
        }
        return yamlPlugin;
    });
}
//# sourceMappingURL=yaml-schema.js.map