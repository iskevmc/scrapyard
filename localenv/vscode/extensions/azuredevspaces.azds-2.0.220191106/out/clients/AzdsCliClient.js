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
const Constants_1 = require("../Constants");
// Surfaces available AZDS CLI commands.
// TODO (950284): Add unit-tests.
class AzdsCliClient {
    constructor(commandRunner, logger) {
        this._commandRunner = commandRunner;
        this._logger = logger;
    }
    getCliVersionAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const args = [`--version`];
                const output = yield this._commandRunner.runAsync(Constants_1.Constants.AzdsCLICommand, args);
                // azds --version output will be:
                //     Azure Dev Spaces CLI
                //     0.1.20181023.7
                // for prod, dev, staging and "0.1.0.11071149-username" or "0.1.0.11071149" for local builds.
                const cliVersion = output.split(/\r\n|\r|\n/)[1];
                this._logger.trace(TelemetryEvent_1.TelemetryEvent.AzdsCliClient_GetCliVersionSuccess);
                return cliVersion;
            }
            catch (error) {
                this._logger.error(TelemetryEvent_1.TelemetryEvent.AzdsCliClient_GetCliVersionError, error);
                throw error;
            }
        });
    }
    prepAsync(shouldUpgrade, shouldAddPublicEndpoint = false, customData = null) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let args = [`prep`];
                if (shouldUpgrade) {
                    args.push(`--upgrade`);
                }
                if (shouldAddPublicEndpoint) {
                    args.push(`--public`);
                }
                if (customData != null) {
                    args.push(`--custom-data`, customData);
                }
                yield this._commandRunner.runAsync(Constants_1.Constants.AzdsCLICommand, args);
                this._logger.trace(TelemetryEvent_1.TelemetryEvent.AzdsCliClient_PrepSuccess, {
                    upgrade: shouldUpgrade.toString(),
                    public: shouldAddPublicEndpoint.toString(),
                    customData: customData
                });
            }
            catch (error) {
                this._logger.error(TelemetryEvent_1.TelemetryEvent.AzdsCliClient_PrepError, error, {
                    upgrade: shouldUpgrade.toString(),
                    public: shouldAddPublicEndpoint.toString(),
                    customData: customData
                });
                throw error;
            }
        });
    }
    listUrisAsync(allSpaces = false) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var args = [`list-uris`, `-o`, `json`];
                if (allSpaces && allSpaces === true) {
                    args.push('--all');
                }
                const output = yield this._commandRunner.runAsync(Constants_1.Constants.AzdsCLICommand, args);
                const accessPoints = JSON.parse(output.replace(/[\r\n]/g, ""));
                this._logger.trace(TelemetryEvent_1.TelemetryEvent.AzdsCliClient_ListUrisSuccess);
                return accessPoints;
            }
            catch (error) {
                this._logger.error(TelemetryEvent_1.TelemetryEvent.AzdsCliClient_ListUrisError, error);
                throw error;
            }
        });
    }
    // Warning: you shouldn't await on this method as the daemon command *will not* return as long as it is running.
    startDaemonAsync(ppid, importValue = null) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let args = [`daemon`, `--ppid`, ppid.toString()];
                if (importValue != null) {
                    args.push(`--import`, importValue);
                }
                this._logger.trace(TelemetryEvent_1.TelemetryEvent.AzdsCliClient_StartDaemon, {
                    ppid: ppid.toString(),
                    importValue: importValue
                });
                yield this._commandRunner.runAsync(Constants_1.Constants.AzdsCLICommand, args);
            }
            catch (error) {
                this._logger.error(TelemetryEvent_1.TelemetryEvent.AzdsCliClient_StartDaemonError, error, {
                    ppid: ppid.toString(),
                    importValue: importValue
                });
                throw error;
            }
        });
    }
    stopDaemonAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const args = [`daemon`, `--stop`];
                yield this._commandRunner.runAsync(Constants_1.Constants.AzdsCLICommand, args);
                this._logger.trace(TelemetryEvent_1.TelemetryEvent.AzdsCliClient_StopDaemonSuccess);
            }
            catch (error) {
                this._logger.error(TelemetryEvent_1.TelemetryEvent.AzdsCliClient_StopDaemonError, error);
                throw error;
            }
        });
    }
}
exports.AzdsCliClient = AzdsCliClient;
//# sourceMappingURL=AzdsCliClient.js.map