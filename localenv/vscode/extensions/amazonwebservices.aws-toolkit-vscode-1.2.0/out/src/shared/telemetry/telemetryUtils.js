"use strict";
/*!
 * Copyright 2018-2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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
const extensionGlobals_1 = require("../extensionGlobals");
const telemetryTypes_1 = require("./telemetryTypes");
function defaultMetricDatum(name) {
    return {
        name: name,
        unit: 'Count',
        value: 1
    };
}
exports.defaultMetricDatum = defaultMetricDatum;
function registerCommand({ command, thisArg, register = vscode.commands.registerCommand, telemetryName = {
    namespace: 'Command',
    name: command
}, callback }) {
    return register(command, (...callbackArgs) => __awaiter(this, void 0, void 0, function* () {
        const startTime = new Date();
        let hasException = false;
        let result;
        try {
            result = yield callback(...callbackArgs);
        }
        catch (e) {
            hasException = true;
            throw e;
        }
        finally {
            const endTime = new Date();
            const datum = result && result.datum ? result.datum : defaultMetricDatum(telemetryName.name);
            if (!datum.metadata) {
                datum.metadata = new Map();
            }
            setMetadataIfNotExists(datum.metadata, telemetryTypes_1.METADATA_FIELD_NAME.RESULT, hasException ? telemetryTypes_1.MetadataResult.Fail.toString() : telemetryTypes_1.MetadataResult.Pass.toString());
            setMetadataIfNotExists(datum.metadata, 'duration', `${endTime.getTime() - startTime.getTime()}`);
            extensionGlobals_1.ext.telemetry.record({
                namespace: telemetryName.namespace,
                createTime: startTime,
                data: [datum]
            });
        }
        return result;
    }), thisArg);
}
exports.registerCommand = registerCommand;
function setMetadataIfNotExists(metadata, key, value) {
    if (!metadata.has(key)) {
        metadata.set(key, value);
    }
}
//# sourceMappingURL=telemetryUtils.js.map