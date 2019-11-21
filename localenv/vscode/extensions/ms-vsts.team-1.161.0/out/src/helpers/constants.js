/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable:variable-name */
class Constants {
}
Constants.ExtensionName = "team";
Constants.ExtensionUserAgentName = "AzureReposVSCode";
Constants.ExtensionVersion = "1.161.0";
Constants.OAuth = "OAuth";
Constants.TokenLearnMoreUrl = "https://aka.ms/v9r4jt";
Constants.TokenShowMeUrl = "https://aka.ms/o2wkmo";
Constants.ReadmeLearnMoreUrl = "https://aka.ms/jkapah";
Constants.TfvcLearnMoreUrl = "https://github.com/Microsoft/azure-repos-vscode/blob/master/TFVC_README.md#quick-start";
Constants.ServerWorkspaceUrl = "https://github.com/Microsoft/azure-repos-vscode/blob/master/TFVC_README.md#what-is-the-difference-between-a-local-and-server-workspace-how-can-i-tell-which-one-im-working-with";
Constants.VS2015U3CSRUrl = "https://msdn.microsoft.com/en-us/library/mt752379.aspx";
Constants.WorkspaceNotDetectedByClcUrl = "https://github.com/Microsoft/azure-repos-vscode/blob/master/TFVC_README.md#using-the-tee-clc-i-am-unable-to-access-an-existing-local-workspace-what-can-i-do";
Constants.NonEnuTfExeConfiguredUrl = "https://github.com/Microsoft/azure-repos-vscode/blob/master/TFVC_README.md#i-received-the-it-appears-you-have-configured-a-non-english-version-of-the-tf-executable-please-ensure-an-english-version-is-properly-configured-error-message-after-configuring-tfexe-how-can-i-get-the-extension-to-work-properly";
exports.Constants = Constants;
class CommandNames {
}
CommandNames.CommandPrefix = Constants.ExtensionName + ".";
CommandNames.AssociateWorkItems = CommandNames.CommandPrefix + "AssociateWorkItems";
CommandNames.GetPullRequests = CommandNames.CommandPrefix + "GetPullRequests";
CommandNames.OpenBlamePage = CommandNames.CommandPrefix + "OpenBlamePage";
CommandNames.OpenBuildSummaryPage = CommandNames.CommandPrefix + "OpenBuildSummaryPage";
CommandNames.OpenFileHistory = CommandNames.CommandPrefix + "OpenFileHistory";
CommandNames.OpenNewBug = CommandNames.CommandPrefix + "OpenNewBug";
CommandNames.OpenNewTask = CommandNames.CommandPrefix + "OpenNewTask";
CommandNames.OpenNewPullRequest = CommandNames.CommandPrefix + "OpenNewPullRequest";
CommandNames.OpenNewWorkItem = CommandNames.CommandPrefix + "OpenNewWorkItem";
CommandNames.OpenTeamSite = CommandNames.CommandPrefix + "OpenTeamSite";
CommandNames.RefreshPollingStatus = CommandNames.CommandPrefix + "RefreshPollingStatus";
CommandNames.Reinitialize = CommandNames.CommandPrefix + "Reinitialize";
CommandNames.SendFeedback = CommandNames.CommandPrefix + "SendFeedback";
CommandNames.Signin = CommandNames.CommandPrefix + "Signin";
CommandNames.Signout = CommandNames.CommandPrefix + "Signout";
CommandNames.ViewWorkItemQueries = CommandNames.CommandPrefix + "ViewWorkItemQueries";
CommandNames.ViewWorkItems = CommandNames.CommandPrefix + "ViewWorkItems";
CommandNames.ViewPinnedQueryWorkItems = CommandNames.CommandPrefix + "ViewPinnedQueryWorkItems";
exports.CommandNames = CommandNames;
class DeviceFlowConstants {
}
DeviceFlowConstants.ManualOption = "manual";
DeviceFlowConstants.DeviceFlowOption = "deviceflow";
DeviceFlowConstants.ClientId = "97877f11-0fc6-4aee-b1ff-febb0519dd00";
DeviceFlowConstants.RedirectUri = "https://java.visualstudio.com";
exports.DeviceFlowConstants = DeviceFlowConstants;
class TfvcCommandNames {
}
TfvcCommandNames.CommandPrefix = "tfvc.";
TfvcCommandNames.Checkin = TfvcCommandNames.CommandPrefix + "Checkin";
TfvcCommandNames.Delete = TfvcCommandNames.CommandPrefix + "Delete";
TfvcCommandNames.Exclude = TfvcCommandNames.CommandPrefix + "Exclude";
TfvcCommandNames.ExcludeAll = TfvcCommandNames.CommandPrefix + "ExcludeAll";
TfvcCommandNames.Include = TfvcCommandNames.CommandPrefix + "Include";
TfvcCommandNames.IncludeAll = TfvcCommandNames.CommandPrefix + "IncludeAll";
TfvcCommandNames.Open = TfvcCommandNames.CommandPrefix + "Open";
TfvcCommandNames.OpenDiff = TfvcCommandNames.CommandPrefix + "OpenDiff";
TfvcCommandNames.OpenFile = TfvcCommandNames.CommandPrefix + "OpenFile";
TfvcCommandNames.Refresh = TfvcCommandNames.CommandPrefix + "Refresh";
TfvcCommandNames.Rename = TfvcCommandNames.CommandPrefix + "Rename";
TfvcCommandNames.ResolveKeepYours = TfvcCommandNames.CommandPrefix + "ResolveKeepYours";
TfvcCommandNames.ResolveTakeTheirs = TfvcCommandNames.CommandPrefix + "ResolveTakeTheirs";
TfvcCommandNames.ShowOutput = TfvcCommandNames.CommandPrefix + "ShowOutput";
TfvcCommandNames.Sync = TfvcCommandNames.CommandPrefix + "Sync";
TfvcCommandNames.Undo = TfvcCommandNames.CommandPrefix + "Undo";
TfvcCommandNames.UndoAll = TfvcCommandNames.CommandPrefix + "UndoAll";
exports.TfvcCommandNames = TfvcCommandNames;
class SettingNames {
}
SettingNames.SettingsPrefix = Constants.ExtensionName + ".";
SettingNames.PinnedQueries = SettingNames.SettingsPrefix + "pinnedQueries";
SettingNames.AccessTokens = SettingNames.SettingsPrefix + "accessTokens";
SettingNames.LoggingPrefix = SettingNames.SettingsPrefix + "logging.";
SettingNames.LoggingLevel = SettingNames.LoggingPrefix + "level";
SettingNames.PollingInterval = SettingNames.SettingsPrefix + "pollingInterval";
SettingNames.AppInsights = SettingNames.SettingsPrefix + "appInsights.";
SettingNames.AppInsightsEnabled = SettingNames.AppInsights + "enabled";
SettingNames.AppInsightsKey = SettingNames.AppInsights + "key";
SettingNames.RemoteUrl = SettingNames.SettingsPrefix + "remoteUrl";
SettingNames.TeamProject = SettingNames.SettingsPrefix + "teamProject";
SettingNames.BuildDefinitionId = SettingNames.SettingsPrefix + "buildDefinitionId";
SettingNames.ShowWelcomeMessage = SettingNames.SettingsPrefix + "showWelcomeMessage";
exports.SettingNames = SettingNames;
class TelemetryEvents {
}
TelemetryEvents.TelemetryPrefix = Constants.ExtensionName + "/";
TelemetryEvents.AssociateWorkItems = TelemetryEvents.TelemetryPrefix + "associateworkitems";
TelemetryEvents.DeviceFlowCanceled = TelemetryEvents.TelemetryPrefix + "deviceflowcanceled";
TelemetryEvents.DeviceFlowFailed = TelemetryEvents.TelemetryPrefix + "deviceflowfailed";
TelemetryEvents.DeviceFlowPat = TelemetryEvents.TelemetryPrefix + "deviceflowpat";
TelemetryEvents.ExternalRepository = TelemetryEvents.TelemetryPrefix + "externalrepo";
TelemetryEvents.Installed = TelemetryEvents.TelemetryPrefix + "installed";
TelemetryEvents.ManualPat = TelemetryEvents.TelemetryPrefix + "manualpat";
TelemetryEvents.OpenAdditionalQueryResults = TelemetryEvents.TelemetryPrefix + "openaddlqueryresults";
TelemetryEvents.OpenBlamePage = TelemetryEvents.TelemetryPrefix + "openblame";
TelemetryEvents.OpenBuildSummaryPage = TelemetryEvents.TelemetryPrefix + "openbuildsummary";
TelemetryEvents.OpenFileHistory = TelemetryEvents.TelemetryPrefix + "openfilehistory";
TelemetryEvents.OpenNewTask = TelemetryEvents.TelemetryPrefix + "opennewtask";
TelemetryEvents.OpenNewBug = TelemetryEvents.TelemetryPrefix + "opennewbug";
TelemetryEvents.OpenNewPullRequest = TelemetryEvents.TelemetryPrefix + "opennewpullrequest";
TelemetryEvents.OpenNewWorkItem = TelemetryEvents.TelemetryPrefix + "opennewworkitem";
TelemetryEvents.OpenRepositoryHistory = TelemetryEvents.TelemetryPrefix + "openrepohistory";
TelemetryEvents.OpenTeamSite = TelemetryEvents.TelemetryPrefix + "openteamprojectweb";
TelemetryEvents.ReadmeLearnMoreClick = TelemetryEvents.TelemetryPrefix + "readmelearnmoreclick";
TelemetryEvents.SendAFrown = TelemetryEvents.TelemetryPrefix + "sendafrown";
TelemetryEvents.SendASmile = TelemetryEvents.TelemetryPrefix + "sendasmile";
TelemetryEvents.ShowMyWorkItemQueries = TelemetryEvents.TelemetryPrefix + "showmyworkitemqueries";
TelemetryEvents.StartUp = TelemetryEvents.TelemetryPrefix + "startup";
TelemetryEvents.TokenLearnMoreClick = TelemetryEvents.TelemetryPrefix + "tokenlearnmoreclick";
TelemetryEvents.TokenShowMeClick = TelemetryEvents.TelemetryPrefix + "tokenshowmeclick";
TelemetryEvents.UnsupportedServerVersion = TelemetryEvents.TelemetryPrefix + "unsupportedversion";
TelemetryEvents.UnsupportedWitServerVersion = TelemetryEvents.TelemetryPrefix + "unsupportedwitversion";
TelemetryEvents.ViewPullRequest = TelemetryEvents.TelemetryPrefix + "viewpullrequest";
TelemetryEvents.ViewPullRequests = TelemetryEvents.TelemetryPrefix + "viewpullrequests";
TelemetryEvents.ViewMyWorkItems = TelemetryEvents.TelemetryPrefix + "viewmyworkitems";
TelemetryEvents.ViewPinnedQueryWorkItems = TelemetryEvents.TelemetryPrefix + "viewpinnedqueryworkitems";
TelemetryEvents.ViewWorkItem = TelemetryEvents.TelemetryPrefix + "viewworkitem";
TelemetryEvents.ViewWorkItems = TelemetryEvents.TelemetryPrefix + "viewworkitems";
TelemetryEvents.VS2015U3CSR = TelemetryEvents.TelemetryPrefix + "vs2015u3csr";
TelemetryEvents.WelcomeLearnMoreClick = TelemetryEvents.TelemetryPrefix + "welcomelearnmoreclick";
exports.TelemetryEvents = TelemetryEvents;
//Don't export this class. TfvcTelemetryEvents is the only one which should be used when sending telemetry
class TfvcBaseTelemetryEvents {
}
TfvcBaseTelemetryEvents.TelemetryPrefix = "tfvc/";
TfvcBaseTelemetryEvents.Clc = TfvcBaseTelemetryEvents.TelemetryPrefix + "clc";
TfvcBaseTelemetryEvents.Exe = TfvcBaseTelemetryEvents.TelemetryPrefix + "exe";
TfvcBaseTelemetryEvents.Add = "add";
TfvcBaseTelemetryEvents.Checkin = "checkin";
TfvcBaseTelemetryEvents.Configured = "configured";
TfvcBaseTelemetryEvents.Connected = "connected";
TfvcBaseTelemetryEvents.Delete = "delete";
TfvcBaseTelemetryEvents.GetFileContent = "getfilecontent";
TfvcBaseTelemetryEvents.LearnMoreClick = "learnmoreclick";
TfvcBaseTelemetryEvents.NameAndContentConflict = "nameandcontentconflict";
TfvcBaseTelemetryEvents.NonEnuConfiguredMoreDetails = "nonenuconfiguredmoredetails";
TfvcBaseTelemetryEvents.OpenFileHistory = "openfilehistory";
TfvcBaseTelemetryEvents.OpenRepositoryHistory = "openrepohistory";
TfvcBaseTelemetryEvents.RenameConflict = "renameconflict";
TfvcBaseTelemetryEvents.Rename = "rename";
TfvcBaseTelemetryEvents.ResolveConflicts = "resolveconflicts";
TfvcBaseTelemetryEvents.RestrictWorkspace = "restrictworkspace";
TfvcBaseTelemetryEvents.StartUp = "startup";
TfvcBaseTelemetryEvents.Sync = "sync";
TfvcBaseTelemetryEvents.Undo = "undo";
TfvcBaseTelemetryEvents.UndoAll = "undoall";
TfvcBaseTelemetryEvents.WorkspaceAccessError = "workspaceaccesserror";
class TfvcTelemetryEvents {
}
TfvcTelemetryEvents.UsingClc = TfvcBaseTelemetryEvents.Clc;
TfvcTelemetryEvents.UsingExe = TfvcBaseTelemetryEvents.Exe;
TfvcTelemetryEvents.LearnMoreClick = TfvcBaseTelemetryEvents.TelemetryPrefix + TfvcBaseTelemetryEvents.LearnMoreClick;
TfvcTelemetryEvents.NameAndContentConflict = TfvcBaseTelemetryEvents.TelemetryPrefix + TfvcBaseTelemetryEvents.NameAndContentConflict;
TfvcTelemetryEvents.OpenFileHistory = TfvcBaseTelemetryEvents.TelemetryPrefix + TfvcBaseTelemetryEvents.OpenFileHistory;
TfvcTelemetryEvents.OpenRepositoryHistory = TfvcBaseTelemetryEvents.TelemetryPrefix + TfvcBaseTelemetryEvents.OpenRepositoryHistory;
TfvcTelemetryEvents.RenameConflict = TfvcBaseTelemetryEvents.TelemetryPrefix + TfvcBaseTelemetryEvents.RenameConflict;
TfvcTelemetryEvents.RestrictWorkspace = TfvcBaseTelemetryEvents.TelemetryPrefix + TfvcBaseTelemetryEvents.RestrictWorkspace;
TfvcTelemetryEvents.StartUp = TfvcBaseTelemetryEvents.TelemetryPrefix + TfvcBaseTelemetryEvents.StartUp;
TfvcTelemetryEvents.SetupTfvcSupportClick = TfvcBaseTelemetryEvents.TelemetryPrefix + "setuptfvcsupportclick";
//Begin tooling-specific telemetry (tf.exe or CLC)
TfvcTelemetryEvents.ClcConfigured = TfvcTelemetryEvents.UsingClc + "-" + TfvcBaseTelemetryEvents.Configured;
TfvcTelemetryEvents.ExeConfigured = TfvcTelemetryEvents.UsingExe + "-" + TfvcBaseTelemetryEvents.Configured;
TfvcTelemetryEvents.ClcConnected = TfvcTelemetryEvents.UsingClc + "-" + TfvcBaseTelemetryEvents.Connected;
TfvcTelemetryEvents.ExeConnected = TfvcTelemetryEvents.UsingExe + "-" + TfvcBaseTelemetryEvents.Connected;
TfvcTelemetryEvents.AddExe = TfvcTelemetryEvents.UsingExe + "-" + TfvcBaseTelemetryEvents.Add;
TfvcTelemetryEvents.AddClc = TfvcTelemetryEvents.UsingClc + "-" + TfvcBaseTelemetryEvents.Add;
TfvcTelemetryEvents.CheckinExe = TfvcTelemetryEvents.UsingExe + "-" + TfvcBaseTelemetryEvents.Checkin;
TfvcTelemetryEvents.CheckinClc = TfvcTelemetryEvents.UsingClc + "-" + TfvcBaseTelemetryEvents.Checkin;
TfvcTelemetryEvents.DeleteExe = TfvcTelemetryEvents.UsingExe + "-" + TfvcBaseTelemetryEvents.Delete;
TfvcTelemetryEvents.DeleteClc = TfvcTelemetryEvents.UsingClc + "-" + TfvcBaseTelemetryEvents.Delete;
TfvcTelemetryEvents.GetFileContentExe = TfvcTelemetryEvents.UsingExe + "-" + TfvcBaseTelemetryEvents.GetFileContent;
TfvcTelemetryEvents.GetFileContentClc = TfvcTelemetryEvents.UsingClc + "-" + TfvcBaseTelemetryEvents.GetFileContent;
TfvcTelemetryEvents.RenameExe = TfvcTelemetryEvents.UsingExe + "-" + TfvcBaseTelemetryEvents.Rename;
TfvcTelemetryEvents.RenameClc = TfvcTelemetryEvents.UsingClc + "-" + TfvcBaseTelemetryEvents.Rename;
TfvcTelemetryEvents.ResolveConflictsExe = TfvcTelemetryEvents.UsingExe + "-" + TfvcBaseTelemetryEvents.ResolveConflicts;
TfvcTelemetryEvents.ResolveConflictsClc = TfvcTelemetryEvents.UsingClc + "-" + TfvcBaseTelemetryEvents.ResolveConflicts;
TfvcTelemetryEvents.SyncExe = TfvcTelemetryEvents.UsingExe + "-" + TfvcBaseTelemetryEvents.Sync;
TfvcTelemetryEvents.SyncClc = TfvcTelemetryEvents.UsingClc + "-" + TfvcBaseTelemetryEvents.Sync;
TfvcTelemetryEvents.UndoExe = TfvcTelemetryEvents.UsingExe + "-" + TfvcBaseTelemetryEvents.Undo;
TfvcTelemetryEvents.UndoClc = TfvcTelemetryEvents.UsingClc + "-" + TfvcBaseTelemetryEvents.Undo;
TfvcTelemetryEvents.UndoAllExe = TfvcTelemetryEvents.UsingExe + "-" + TfvcBaseTelemetryEvents.UndoAll;
TfvcTelemetryEvents.UndoAllClc = TfvcTelemetryEvents.UsingClc + "-" + TfvcBaseTelemetryEvents.UndoAll;
TfvcTelemetryEvents.ClcCannotAccessWorkspace = TfvcTelemetryEvents.UsingClc + "-" + TfvcBaseTelemetryEvents.WorkspaceAccessError;
TfvcTelemetryEvents.ExeNonEnuConfiguredMoreDetails = TfvcTelemetryEvents.UsingExe + "-" + TfvcBaseTelemetryEvents.NonEnuConfiguredMoreDetails;
exports.TfvcTelemetryEvents = TfvcTelemetryEvents;
class WellKnownRepositoryTypes {
}
WellKnownRepositoryTypes.TfsGit = "TfsGit";
exports.WellKnownRepositoryTypes = WellKnownRepositoryTypes;
class WitQueries {
}
WitQueries.MyWorkItems = "select [System.Id], [System.WorkItemType], [System.Title], [System.State] " +
    "from WorkItems where [System.TeamProject] = @project and " +
    "[System.WorkItemType] <> '' and [System.AssignedTo] = @Me order by [System.ChangedDate] desc";
exports.WitQueries = WitQueries;
class WitTypes {
}
WitTypes.Bug = "Bug";
WitTypes.Task = "Task";
exports.WitTypes = WitTypes;
var MessageTypes;
(function (MessageTypes) {
    MessageTypes[MessageTypes["Error"] = 0] = "Error";
    MessageTypes[MessageTypes["Warn"] = 1] = "Warn";
    MessageTypes[MessageTypes["Info"] = 2] = "Info";
})(MessageTypes = exports.MessageTypes || (exports.MessageTypes = {}));

//# sourceMappingURL=constants.js.map
