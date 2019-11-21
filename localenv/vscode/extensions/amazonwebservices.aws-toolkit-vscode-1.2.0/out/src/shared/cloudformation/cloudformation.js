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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const schema = require("cloudformation-schema-js-yaml");
const yaml = require("js-yaml");
const filesystem = require("../filesystem");
const filesystemUtilities = require("../filesystemUtilities");
const systemUtilities_1 = require("../systemUtilities");
var CloudFormation;
(function (CloudFormation) {
    CloudFormation.SERVERLESS_FUNCTION_TYPE = 'AWS::Serverless::Function';
    function validateProperties(_a) {
        var { Handler, CodeUri, Runtime } = _a, rest = __rest(_a, ["Handler", "CodeUri", "Runtime"]);
        if (!Handler) {
            throw new Error('Missing value: Handler');
        }
        if (!CodeUri) {
            throw new Error('Missing value: CodeUri');
        }
        if (!Runtime) {
            throw new Error('Missing value: Runtime');
        }
        return Object.assign({ Handler,
            CodeUri,
            Runtime }, rest);
    }
    CloudFormation.validateProperties = validateProperties;
    function load(filename) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield systemUtilities_1.SystemUtilities.fileExists(filename))) {
                throw new Error(`Template file not found: ${filename}`);
            }
            const templateAsYaml = yield filesystemUtilities.readFileAsString(filename);
            const template = yaml.safeLoad(templateAsYaml, {
                schema: schema
            });
            validateTemplate(template);
            return template;
        });
    }
    CloudFormation.load = load;
    function save(template, filename) {
        return __awaiter(this, void 0, void 0, function* () {
            const templateAsYaml = yaml.safeDump(template);
            yield filesystem.writeFile(filename, templateAsYaml, 'utf8');
        });
    }
    CloudFormation.save = save;
    function validateTemplate(template) {
        if (!template.Resources) {
            return;
        }
        const lambdaResources = Object.getOwnPropertyNames(template.Resources)
            .map(key => template.Resources[key])
            .filter(resource => resource.Type === CloudFormation.SERVERLESS_FUNCTION_TYPE)
            .map(resource => resource);
        if (lambdaResources.length <= 0) {
            throw new Error('Template does not contain any Lambda resources');
        }
        for (const lambdaResource of lambdaResources) {
            validateResource(lambdaResource);
        }
    }
    CloudFormation.validateTemplate = validateTemplate;
    function validateResource(resource) {
        if (!resource.Type) {
            throw new Error('Missing or invalid value in Template for key: Type');
        }
        if (!!resource.Properties) {
            if (!resource.Properties.Handler || typeof resource.Properties.Handler !== 'string') {
                throw new Error('Missing or invalid value in Template for key: Handler');
            }
            if (!resource.Properties.CodeUri || typeof resource.Properties.CodeUri !== 'string') {
                throw new Error('Missing or invalid value in Template for key: CodeUri');
            }
            if (!!resource.Properties.Runtime && typeof resource.Properties.Runtime !== 'string') {
                throw new Error('Invalid value in Template for key: Runtime');
            }
            if (!!resource.Properties.Timeout && typeof resource.Properties.Timeout !== 'number') {
                throw new Error('Invalid value in Template for key: Timeout');
            }
        }
    }
    CloudFormation.validateResource = validateResource;
    function getRuntime(resource) {
        const properties = resource.Properties;
        if (!properties || !properties.Runtime) {
            throw new Error('Resource does not specify a Runtime');
        }
        return properties.Runtime;
    }
    CloudFormation.getRuntime = getRuntime;
    function getCodeUri(resource) {
        const properties = resource.Properties;
        if (!properties || !properties.CodeUri) {
            throw new Error('Resource does not specify a CodeUri');
        }
        return properties.CodeUri;
    }
    CloudFormation.getCodeUri = getCodeUri;
    function getResourceFromTemplate({ templatePath, handlerName }, context = { loadTemplate: load }) {
        return __awaiter(this, void 0, void 0, function* () {
            const template = yield context.loadTemplate(templatePath);
            return getResourceFromTemplateResources({
                templateResources: template.Resources,
                handlerName
            });
        });
    }
    CloudFormation.getResourceFromTemplate = getResourceFromTemplate;
    function getResourceFromTemplateResources(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const resources = params.templateResources || {};
            const matches = Object.keys(resources)
                .filter(key => matchesHandler({
                resource: resources[key],
                handlerName: params.handlerName
            }))
                .map(key => resources[key]);
            if (matches.length < 1) {
                throw new Error(`Could not find a SAM resource for handler ${params.handlerName}`);
            }
            if (matches.length > 1) {
                // TODO: Is this a valid scenario?
                throw new Error(`Found more than one SAM resource for handler ${params.handlerName}`);
            }
            return matches[0];
        });
    }
    CloudFormation.getResourceFromTemplateResources = getResourceFromTemplateResources;
    function matchesHandler({ resource, handlerName }) {
        return (resource &&
            resource.Type === CloudFormation.SERVERLESS_FUNCTION_TYPE &&
            resource.Properties &&
            // TODO: `resource.Properties.Handler` is relative to `CodeUri`, but
            //       `handlerName` is relative to the directory containing the source
            //       file. To fix, update lambda handler candidate searches for
            //       interpreted languages to return a handler name relative to the
            //       `CodeUri`, rather than to the directory containing the source file.
            resource.Properties.Handler === handlerName);
    }
})(CloudFormation = exports.CloudFormation || (exports.CloudFormation = {}));
//# sourceMappingURL=cloudformation.js.map