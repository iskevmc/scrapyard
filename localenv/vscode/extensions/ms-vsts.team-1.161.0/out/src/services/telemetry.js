/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../helpers/constants");
const appInsights = require("applicationinsights");
const uuid = require("uuid");
const os = require("os");
const crypto = require("crypto");
class Telemetry {
    //Initialize can be called multiple times.  Initially, we have no information about the user but
    //still want to send telemetry.  Once we have user information, we want to update the Telemetry
    //service with that more specific information.  At the same time, we want global/static access
    //to the Telemetry service so we can send telemetry from just about anywhere at anytime.
    static Initialize(settings, context) {
        Telemetry._serverContext = context;
        Telemetry._telemetryEnabled = settings.AppInsightsEnabled;
        // Always initialize Application Insights
        let insightsKey = Telemetry._productionKey;
        if (settings.AppInsightsKey !== undefined) {
            insightsKey = settings.AppInsightsKey;
        }
        appInsights.setup(insightsKey)
            .setAutoCollectConsole(false)
            .setAutoCollectPerformance(false)
            .setAutoCollectRequests(false)
            .setAutoCollectExceptions(false)
            .start();
        Telemetry._appInsightsClient = appInsights.getClient(insightsKey);
        //Need to use HTTPS with v0.15.16 of App Insights
        Telemetry._appInsightsClient.config.endpointUrl = "https://dc.services.visualstudio.com/v2/track";
        Telemetry.setUserId();
        //Assign common properties to all telemetry sent from the default client
        Telemetry.setCommonProperties();
    }
    static SendEvent(event, properties) {
        Telemetry.ensureInitialized();
        if (Telemetry._telemetryEnabled === true) {
            Telemetry._appInsightsClient.trackEvent(event, properties);
        }
    }
    static SendFeedback(event, properties) {
        Telemetry.ensureInitialized();
        // SendFeedback doesn't honor the _telemetryEnabled flag
        Telemetry._appInsightsClient.trackEvent(event, properties);
    }
    static SendException(err, properties) {
        Telemetry.ensureInitialized();
        if (Telemetry._telemetryEnabled === true) {
            Telemetry._appInsightsClient.trackException(err, properties);
        }
    }
    //Make sure we're calling it after initializing
    static ensureInitialized() {
        if (Telemetry._appInsightsClient === undefined) {
            throw new Error("Telemetry service was called before being initialized.");
        }
    }
    //Will generate a consistent ApplicationInsights userId
    static setUserId() {
        let username = "UNKNOWN";
        let hostname = "UNKNOWN";
        if (os.userInfo().username) {
            username = os.userInfo().username;
        }
        if (os.hostname()) {
            hostname = os.hostname();
        }
        const value = `${username}@${hostname}-VSTS`;
        Telemetry._userId = crypto.createHash("sha1").update(value).digest("hex");
    }
    static setCommonProperties() {
        Telemetry._appInsightsClient.commonProperties = {
            "VSTS.TeamFoundationServer.IsHostedServer": Telemetry._serverContext === undefined ? "UNKNOWN" : Telemetry._serverContext.RepoInfo.IsTeamServices.toString(),
            "VSTS.TeamFoundationServer.ServerId": Telemetry._serverContext === undefined ? "UNKNOWN" : Telemetry._serverContext.RepoInfo.Host,
            "VSTS.TeamFoundationServer.Protocol": Telemetry._serverContext === undefined ? "UNKNOWN" : Telemetry._serverContext.RepoInfo.Protocol,
            "VSTS.Core.Machine.OS.Platform": os.platform(),
            "VSTS.Core.Machine.OS.Type": os.type(),
            "VSTS.Core.Machine.OS.Release": os.release(),
            "VSTS.Core.User.Id": Telemetry._userId,
            "Plugin.Version": constants_1.Constants.ExtensionVersion
        };
        //Set the userid on the AI context so that we can get user counts in the telemetry
        const aiUserId = Telemetry._appInsightsClient.context.keys.userId;
        Telemetry._appInsightsClient.context.tags[aiUserId] = Telemetry._userId;
        const aiSessionId = Telemetry._appInsightsClient.context.keys.sessionId;
        Telemetry._appInsightsClient.context.tags[aiSessionId] = Telemetry._sessionId;
    }
}
Telemetry._telemetryEnabled = true;
//Default to a new uuid in case the extension fails before being initialized
Telemetry._userId = "UNKNOWN";
Telemetry._sessionId = uuid.v4(); //The sessionId can be updated later
Telemetry._productionKey = "44267cbb-b9ba-4bce-a37a-338588aa4da3";
exports.Telemetry = Telemetry;

//# sourceMappingURL=telemetry.js.map
