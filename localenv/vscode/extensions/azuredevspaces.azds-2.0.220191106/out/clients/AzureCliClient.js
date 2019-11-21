// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// ----------------------------------------------------------------------------
'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const TelemetryEvent_1 = require("../logger/TelemetryEvent");
// Surfaces available Azure CLI commands.
// TODO (950284): Add unit-tests.
class AzureCliClient {
    constructor(commandRunner, logger) {
        this._commandRunner = commandRunner;
        this._logger = logger;
    }
    getDefaultSubscriptionIdAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const args = [`account`, `show`, `-o`, `json`];
                const output = yield this._commandRunner.runThroughExecAsync(AzureCliClient.AzureCLICommand, args);
                const defaultSubscription = JSON.parse(output.replace(/[\r\n]/g, ""));
                this._logger.trace(TelemetryEvent_1.TelemetryEvent.AzureCliClient_GetDefaultSubscriptionIdSuccess);
                return defaultSubscription.id;
            }
            catch (error) {
                this._logger.error(TelemetryEvent_1.TelemetryEvent.AzureCliClient_GetDefaultSubscriptionIdError, error);
                throw error;
            }
        });
    }
}
AzureCliClient.AzureCLICommand = "az";
exports.AzureCliClient = AzureCliClient;
//# sourceMappingURL=AzureCliClient.js.map