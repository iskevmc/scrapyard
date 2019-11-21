/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const constants_1 = require("./constants");
const logger_1 = require("../helpers/logger");
class BaseSettings {
    readSetting(name, defaultValue) {
        const configuration = vscode_1.workspace.getConfiguration();
        const value = configuration.get(name, undefined);
        // If user specified a value, use it
        if (value !== undefined) {
            return value;
        }
        return defaultValue;
    }
    writeSetting(name, value, global) {
        const configuration = vscode_1.workspace.getConfiguration();
        configuration.update(name, value, global);
    }
}
exports.BaseSettings = BaseSettings;
class PinnedQuerySettings extends BaseSettings {
    constructor(account) {
        super();
        this._account = account;
        this._pinnedQuery = this.getPinnedQuery(account);
    }
    getPinnedQuery(account) {
        const pinnedQueries = this.readSetting(constants_1.SettingNames.PinnedQueries, undefined);
        if (pinnedQueries !== undefined) {
            logger_1.Logger.LogDebug("Found pinned queries in user configuration settings.");
            let global = undefined;
            for (let index = 0; index < pinnedQueries.length; index++) {
                const element = pinnedQueries[index];
                if (element.account === account ||
                    element.account === account + ".visualstudio.com") {
                    return element;
                }
                else if (element.account === "global") {
                    global = element;
                }
            }
            if (global !== undefined) {
                logger_1.Logger.LogDebug("No account-specific pinned query found, using global pinned query.");
                return global;
            }
        }
        logger_1.Logger.LogDebug("No account-specific pinned query or global pinned query found. Using default.");
        return undefined;
    }
    get PinnedQuery() {
        return this._pinnedQuery || { account: this._account, queryText: constants_1.WitQueries.MyWorkItems };
    }
}
exports.PinnedQuerySettings = PinnedQuerySettings;
class Settings extends BaseSettings {
    constructor() {
        super();
        const loggingLevel = constants_1.SettingNames.LoggingLevel;
        this._loggingLevel = this.readSetting(loggingLevel, undefined);
        const pollingInterval = constants_1.SettingNames.PollingInterval;
        this._pollingInterval = this.readSetting(pollingInterval, 10);
        logger_1.Logger.LogDebug("Polling interval value (minutes): " + this._pollingInterval.toString());
        // Ensure a minimum value when an invalid value is set
        if (this._pollingInterval < 10) {
            logger_1.Logger.LogDebug("Polling interval must be greater than 10 minutes.");
            this._pollingInterval = 10;
        }
        this._appInsightsEnabled = this.readSetting(constants_1.SettingNames.AppInsightsEnabled, true);
        this._appInsightsKey = this.readSetting(constants_1.SettingNames.AppInsightsKey, undefined);
        this._remoteUrl = this.readSetting(constants_1.SettingNames.RemoteUrl, undefined);
        this._teamProject = this.readSetting(constants_1.SettingNames.TeamProject, undefined);
        this._buildDefinitionId = this.readSetting(constants_1.SettingNames.BuildDefinitionId, 0);
        this._showWelcomeMessage = this.readSetting(constants_1.SettingNames.ShowWelcomeMessage, true);
    }
    get AppInsightsEnabled() {
        return this._appInsightsEnabled;
    }
    get AppInsightsKey() {
        return this._appInsightsKey;
    }
    get LoggingLevel() {
        return this._loggingLevel;
    }
    get PollingInterval() {
        return this._pollingInterval;
    }
    get RemoteUrl() {
        return this._remoteUrl;
    }
    get TeamProject() {
        return this._teamProject;
    }
    get BuildDefinitionId() {
        return this._buildDefinitionId;
    }
    get ShowWelcomeMessage() {
        return this._showWelcomeMessage;
    }
    set ShowWelcomeMessage(value) {
        this.writeSetting(constants_1.SettingNames.ShowWelcomeMessage, value, true /*global*/);
    }
}
exports.Settings = Settings;

//# sourceMappingURL=settings.js.map
