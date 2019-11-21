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
const yaml = require("js-yaml");
const path = require("path");
const filesystem_1 = require("../../../shared/filesystem");
const filesystemUtilities = require("../../../shared/filesystemUtilities");
const cloudformation_1 = require("../../cloudformation/cloudformation");
class SamTemplateGenerator {
    constructor() {
        this.properties = {};
    }
    withResourceName(resourceName) {
        this.resourceName = resourceName;
        return this;
    }
    withFunctionHandler(handlerName) {
        this.properties.Handler = handlerName;
        return this;
    }
    withCodeUri(codeUri) {
        this.properties.CodeUri = codeUri;
        return this;
    }
    withRuntime(runtime) {
        this.properties.Runtime = runtime;
        return this;
    }
    withMemorySize(memorySize) {
        this.properties.MemorySize = memorySize;
        return this;
    }
    withTimeout(timeout) {
        this.properties.Timeout = timeout;
        return this;
    }
    withEnvironment(env) {
        this.properties.Environment = env;
        return this;
    }
    withGlobals(globals) {
        this.globals = globals;
        return this;
    }
    generate(filename) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.resourceName) {
                throw new Error('Missing value: ResourceName');
            }
            const template = {
                Resources: {
                    [this.resourceName]: {
                        Type: cloudformation_1.CloudFormation.SERVERLESS_FUNCTION_TYPE,
                        Properties: cloudformation_1.CloudFormation.validateProperties(this.properties)
                    }
                }
            };
            if (this.globals) {
                template.Globals = this.globals;
            }
            const templateAsYaml = yaml.safeDump(template, { skipInvalid: true });
            const parentDirectory = path.dirname(filename);
            if (!(yield filesystemUtilities.fileExists(parentDirectory))) {
                yield filesystem_1.mkdir(parentDirectory, { recursive: true });
            }
            yield filesystem_1.writeFile(filename, templateAsYaml, 'utf8');
        });
    }
}
exports.SamTemplateGenerator = SamTemplateGenerator;
//# sourceMappingURL=samTemplateGenerator.js.map