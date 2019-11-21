"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_extension_telemetry_1 = require("vscode-extension-telemetry");
const constants_1 = require("./constants");
const vscode = require("vscode");
const packageJson = vscode.extensions.getExtension(constants_1.Constants.ExtensionId).packageJSON;
class TelemetryClient {
    static sendEvent(eventName, properties) {
        if (packageJson.aiKey && packageJson.aiKey != '') {
            this._client.sendTelemetryEvent(eventName, properties);
        }
    }
}
TelemetryClient._client = (packageJson.aiKey === 'undefined' || packageJson.aiKey === '') ? null : new vscode_extension_telemetry_1.default(constants_1.Constants.ExtensionId, packageJson.version, packageJson.aiKey);
exports.TelemetryClient = TelemetryClient;
//# sourceMappingURL=telemetryClient.js.map