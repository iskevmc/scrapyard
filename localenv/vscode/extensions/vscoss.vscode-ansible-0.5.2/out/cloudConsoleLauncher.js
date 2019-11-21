"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request-promise");
const consoleApiVersion = '2017-08-01-preview';
function getUserSettings(accessToken, armEndpoint) {
    return __awaiter(this, void 0, void 0, function* () {
        const targetUri = `${armEndpoint}/providers/Microsoft.Portal/userSettings/cloudconsole?api-version=${consoleApiVersion}`;
        const response = yield request({
            uri: targetUri,
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            simple: false,
            resolveWithFullResponse: true,
            json: true,
        });
        if (response.statusCode < 200 || response.statusCode > 299) {
            return;
        }
        return response.body && response.body.properties;
    });
}
exports.getUserSettings = getUserSettings;
function getStorageAccountKey(accessToken, subscriptionId, resourceGroup, storageAccountName) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield request({
            uri: `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Storage/storageAccounts/${storageAccountName}/listKeys?api-version=2017-06-01`,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
            simple: false,
            resolveWithFullResponse: true,
            json: true,
        });
        if (response.statusCode < 200 || response.statusCode > 299) {
            return;
        }
        return response.body && response.body.keys && response.body.keys[0] && response.body.keys[0].value;
    });
}
function getStorageAccountforCloudShell(cloudShell) {
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield cloudShell.session;
        const token = yield acquireToken(session);
        const userSettings = yield getUserSettings(token.accessToken, session.environment.resourceManagerEndpointUrl);
        if (!userSettings) {
            return;
        }
        const storageProfile = userSettings.storageProfile;
        const storageAccountSettings = storageProfile.storageAccountResourceId.substr(1, storageProfile.storageAccountResourceId.length).split("/");
        const storageAccountKey = yield getStorageAccountKey(token.accessToken, storageAccountSettings[1], storageAccountSettings[3], storageAccountSettings[7]);
        if (!storageAccountKey) {
            return;
        }
        return {
            resourceGroup: storageAccountSettings[3],
            storageAccountName: storageAccountSettings[7],
            fileShareName: storageProfile.fileShareName,
            storageAccountKey
        };
    });
}
exports.getStorageAccountforCloudShell = getStorageAccountforCloudShell;
function acquireToken(session) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const credentials = session.credentials;
            const environment = session.environment;
            credentials.context.acquireToken(environment.activeDirectoryResourceId, credentials.username, credentials.clientId, (err, result) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve({
                        session,
                        accessToken: result.accessToken,
                        refreshToken: result.refreshToken,
                    });
                }
            });
        });
    });
}
//# sourceMappingURL=cloudConsoleLauncher.js.map