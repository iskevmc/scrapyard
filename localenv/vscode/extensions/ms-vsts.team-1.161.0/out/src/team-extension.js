/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
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
const vscode_1 = require("vscode");
const vsts_device_flow_auth_1 = require("vsts-device-flow-auth");
const settings_1 = require("./helpers/settings");
const constants_1 = require("./helpers/constants");
const logger_1 = require("./helpers/logger");
const strings_1 = require("./helpers/strings");
const useragentprovider_1 = require("./helpers/useragentprovider");
const utils_1 = require("./helpers/utils");
const vscodeutils_1 = require("./helpers/vscodeutils");
const repositorycontext_1 = require("./contexts/repositorycontext");
const buildclient_1 = require("./clients/buildclient");
const gitclient_1 = require("./clients/gitclient");
const witclient_1 = require("./clients/witclient");
const telemetry_1 = require("./services/telemetry");
const os = require("os");
const util = require("util");
const vscode = require("vscode");
class TeamExtension {
    constructor(manager) {
        this._signedOut = false;
        this._signingIn = false;
        this._manager = manager;
    }
    //Gets any available build status information and adds it to the status bar
    DisplayCurrentBranchBuildStatus() {
        if (this._manager.EnsureInitialized(repositorycontext_1.RepositoryType.ANY)) {
            this._buildClient.DisplayCurrentBuildStatus(this._manager.RepoContext, false, this._manager.Settings.BuildDefinitionId);
        }
        else {
            this._manager.DisplayErrorMessage();
        }
    }
    //Initial method to display, select and navigate to my pull requests
    GetMyPullRequests() {
        if (this._manager.EnsureInitialized(repositorycontext_1.RepositoryType.GIT)) {
            if (this._gitClient) {
                this._gitClient.GetMyPullRequests();
            }
        }
        else {
            this._manager.DisplayErrorMessage();
        }
    }
    //Keeps track of whether the user is signed in (or not). It's used by the
    //ExtensionManager to display more helpful messages after signing out.
    get IsSignedOut() {
        return this._signedOut;
    }
    //Prompts user for either manual or device-flow mechanism for acquiring a personal access token.
    //If manual, we provide the same experience as we always have
    //If device-flow (automatic), we provide the new 'device flow' experience
    requestPersonalAccessToken() {
        return __awaiter(this, void 0, void 0, function* () {
            const choices = [];
            choices.push({ label: strings_1.Strings.DeviceFlowManualPrompt, description: undefined, id: constants_1.DeviceFlowConstants.ManualOption });
            choices.push({ label: strings_1.Strings.DeviceFlowPrompt, description: undefined, id: constants_1.DeviceFlowConstants.DeviceFlowOption });
            const choice = yield vscode_1.window.showQuickPick(choices, { matchOnDescription: false, placeHolder: strings_1.Strings.DeviceFlowPlaceholder });
            if (choice) {
                if (choice.id === constants_1.DeviceFlowConstants.ManualOption) {
                    logger_1.Logger.LogDebug(`Manual personal access token option chosen.`);
                    const token = yield vscode_1.window.showInputBox({ value: "", prompt: `${strings_1.Strings.ProvideAccessToken} (${this._manager.ServerContext.RepoInfo.Account})`, placeHolder: "", password: true });
                    if (token) {
                        telemetry_1.Telemetry.SendEvent(constants_1.TelemetryEvents.ManualPat);
                    }
                    return token;
                }
                else if (choice.id === constants_1.DeviceFlowConstants.DeviceFlowOption) {
                    logger_1.Logger.LogDebug(`Device flow personal access token option chosen.`);
                    const authOptions = {
                        clientId: constants_1.DeviceFlowConstants.ClientId,
                        redirectUri: constants_1.DeviceFlowConstants.RedirectUri,
                        userAgent: `${useragentprovider_1.UserAgentProvider.UserAgent}`
                    };
                    const tokenOptions = {
                        tokenDescription: `Azure Repos VSCode extension: ${this._manager.ServerContext.RepoInfo.AccountUrl} on ${os.hostname()}`
                    };
                    const dfa = new vsts_device_flow_auth_1.DeviceFlowAuthenticator(this._manager.ServerContext.RepoInfo.AccountUrl, authOptions, tokenOptions);
                    const details = yield dfa.GetDeviceFlowDetails();
                    //To sign in, use a web browser to open the page https://aka.ms/devicelogin and enter the code F3VXCTH2L to authenticate.
                    const value = yield vscode_1.window.showInputBox({ value: details.UserCode, prompt: `${strings_1.Strings.DeviceFlowCopyCode} (${details.VerificationUrl})`, placeHolder: undefined, password: false });
                    if (value) {
                        //At this point, user has no way to cancel until our timeout expires. Before this point, they could
                        //cancel out of the showInputBox. After that, they will need to wait for the automatic cancel to occur.
                        utils_1.Utils.OpenUrl(details.VerificationUrl);
                        //FUTURE: Could we display a message that allows the user to cancel the authentication? If they escape from the
                        //message or click Close, they wouldn't have that chance any longer. If they leave the message displaying, they
                        //have an opportunity to cancel. However, once authenticated, we no longer have an ability to close the message
                        //automatically or change the message that's displayed. :-/
                        //FUTURE: Add a 'button' on the status bar that can be used to cancel the authentication
                        //Wait for up to 5 minutes before we cancel the stauts polling (Azure's default is 900s/15 minutes)
                        const timeout = 5 * 60 * 1000;
                        /* tslint:disable:align */
                        const timer = setTimeout(() => {
                            logger_1.Logger.LogDebug(`Device flow authentication canceled after ${timeout}ms.`);
                            telemetry_1.Telemetry.SendEvent(constants_1.TelemetryEvents.DeviceFlowCanceled);
                            dfa.Cancel(true); //throw on canceling
                        }, timeout);
                        /* tslint:enable:align */
                        //We need to await on withProgress here because we need a token before continuing forward
                        const title = util.format(strings_1.Strings.DeviceFlowAuthenticatingToTeamServices, details.UserCode);
                        const token = yield vscode_1.window.withProgress({ location: vscode_1.ProgressLocation.Window, title: title }, () => __awaiter(this, void 0, void 0, function* () {
                            const accessToken = yield dfa.WaitForPersonalAccessToken();
                            //Since we will cancel automatically after timeout, if we _do_ get an accessToken then we need to call clearTimeout
                            if (accessToken) {
                                clearTimeout(timer);
                                telemetry_1.Telemetry.SendEvent(constants_1.TelemetryEvents.DeviceFlowPat);
                            }
                            return accessToken;
                        }));
                        return token;
                    }
                    else {
                        logger_1.Logger.LogDebug(`User has canceled the device flow authentication mechanism.`);
                    }
                }
            }
            return undefined;
        });
    }
    Signin() {
        return __awaiter(this, void 0, void 0, function* () {
            // For Signin, first we need to verify _serverContext
            if (this._manager.ServerContext !== undefined && this._manager.ServerContext.RepoInfo !== undefined && this._manager.ServerContext.RepoInfo.IsTeamFoundation === true) {
                this._signedOut = false;
                logger_1.Logger.LogDebug(`Starting sign in process`);
                if (this._manager.ServerContext.RepoInfo.IsTeamFoundationServer === true) {
                    const defaultUsername = this.getDefaultUsername();
                    const username = yield vscode_1.window.showInputBox({ value: defaultUsername || "", prompt: strings_1.Strings.ProvideUsername + " (" + this._manager.ServerContext.RepoInfo.Account + ")", placeHolder: "", password: false });
                    if (username !== undefined && username.length > 0) {
                        const password = yield vscode_1.window.showInputBox({ value: "", prompt: strings_1.Strings.ProvidePassword + " (" + username + ")", placeHolder: "", password: true });
                        if (password !== undefined) {
                            logger_1.Logger.LogInfo("Signin: Username and Password provided as authentication.");
                            this._manager.CredentialManager.StoreCredentials(this._manager.ServerContext, username, password).then(() => {
                                // We don't test the credentials to make sure they're good here.  Do so on the next command that's run.
                                logger_1.Logger.LogDebug(`Reinitializing after successfully storing credentials for Team Foundation Server.`);
                                this._manager.Reinitialize();
                            }).catch((err) => {
                                // TODO: Should the message direct the user to open an issue?  send feedback?
                                const msg = strings_1.Strings.UnableToStoreCredentials + this._manager.ServerContext.RepoInfo.Host;
                                this._manager.ReportError(err, msg, true);
                            });
                        }
                    }
                }
                else if (this._manager.ServerContext.RepoInfo.IsTeamServices === true && !this._signingIn) {
                    this._signingIn = true;
                    try {
                        const token = yield this.requestPersonalAccessToken();
                        if (token !== undefined) {
                            logger_1.Logger.LogInfo(`Signin: Personal Access Token provided as authentication.`);
                            this._manager.CredentialManager.StoreCredentials(this._manager.ServerContext, constants_1.Constants.OAuth, token.trim()).then(() => {
                                logger_1.Logger.LogDebug(`Reinitializing after successfully storing credentials for Azure DevOps Services.`);
                                this._manager.Reinitialize();
                            }).catch((err) => {
                                // TODO: Should the message direct the user to open an issue?  send feedback?
                                const msg = `${strings_1.Strings.UnableToStoreCredentials} ${this._manager.ServerContext.RepoInfo.Host}`;
                                this._manager.ReportError(err, msg, true);
                            });
                        }
                    }
                    catch (err) {
                        let msg = util.format(strings_1.Strings.ErrorRequestingToken, this._manager.ServerContext.RepoInfo.AccountUrl);
                        if (err.message) {
                            msg = `${msg} (${err.message})`;
                            //If the request wasn't canceled, log a failure of the device flow auth
                            if (err.message.indexOf("Request canceled by user") === -1) {
                                telemetry_1.Telemetry.SendEvent(constants_1.TelemetryEvents.DeviceFlowFailed);
                            }
                        }
                        //FUTURE: Add a ButtonMessageItem to provide additional help? Log a bug?
                        this._manager.ReportError(err, msg, true);
                    }
                    this._signingIn = false;
                }
            }
            else {
                //If _manager has an error to display, display it and forgo the other. Otherwise, show the default error message.
                const displayed = this._manager.DisplayErrorMessage();
                if (!displayed) {
                    const messageItem = { title: strings_1.Strings.LearnMore,
                        url: constants_1.Constants.ReadmeLearnMoreUrl,
                        telemetryId: constants_1.TelemetryEvents.ReadmeLearnMoreClick };
                    const tfvcInfoItem = { title: strings_1.Strings.LearnMoreAboutTfvc,
                        url: constants_1.Constants.TfvcLearnMoreUrl,
                        telemetryId: constants_1.TfvcTelemetryEvents.LearnMoreClick };
                    vscodeutils_1.VsCodeUtils.ShowErrorMessage(strings_1.Strings.NoRepoInformation, messageItem, tfvcInfoItem);
                }
            }
        });
    }
    Signout() {
        // For Logout, we just need to verify _serverContext and don't want to set this._errorMessage
        if (this._manager.ServerContext !== undefined && this._manager.ServerContext.RepoInfo !== undefined && this._manager.ServerContext.RepoInfo.IsTeamFoundation === true) {
            logger_1.Logger.LogDebug(`Starting sign out process`);
            this._manager.CredentialManager.RemoveCredentials(this._manager.ServerContext).then(() => {
                logger_1.Logger.LogInfo(`Signout: Removed credentials for host '${this._manager.ServerContext.RepoInfo.Host}'`);
            }).catch((err) => {
                const msg = strings_1.Strings.UnableToRemoveCredentials + this._manager.ServerContext.RepoInfo.Host;
                this._manager.ReportError(err, msg, true);
            }).finally(() => {
                this._signedOut = true; //keep track of our status so we can display helpful info later
                this._manager.SignOut(); //tell the ExtensionManager to clean up
                this.dispose(); //dispose the status bar items
            });
        }
        else {
            this._manager.DisplayErrorMessage(strings_1.Strings.NoRepoInformation);
        }
    }
    //Opens the build summary page for a particular build
    OpenBlamePage() {
        if (this._manager.EnsureInitialized(repositorycontext_1.RepositoryType.GIT)) {
            if (this._gitClient) {
                this._gitClient.OpenBlamePage(this._manager.RepoContext);
            }
        }
        else {
            this._manager.DisplayErrorMessage();
        }
    }
    //Opens the build summary page for a particular build
    OpenBuildSummaryPage() {
        if (this._manager.EnsureInitialized(repositorycontext_1.RepositoryType.ANY)) {
            this._buildClient.OpenBuildSummaryPage();
        }
        else {
            this._manager.DisplayErrorMessage();
        }
    }
    //Opens the file history page for the currently active file
    OpenFileHistory() {
        if (this._manager.EnsureInitialized(repositorycontext_1.RepositoryType.ANY)) {
            if (this._manager.RepoContext.Type === repositorycontext_1.RepositoryType.GIT && this._gitClient) {
                this._gitClient.OpenFileHistory(this._manager.RepoContext);
            }
            else if (this._manager.RepoContext.Type === repositorycontext_1.RepositoryType.TFVC) {
                this._manager.Tfvc.ViewHistory();
            }
            else {
                this._manager.DisplayErrorMessage(strings_1.Strings.NoRepoInformation);
            }
        }
        else {
            this._manager.DisplayErrorMessage();
        }
    }
    //Opens a browser to a new Bug
    OpenNewBug() {
        if (this._manager.EnsureInitialized(repositorycontext_1.RepositoryType.ANY)) {
            //Bug is in all three templates
            const taskTitle = vscodeutils_1.VsCodeUtils.GetActiveSelection();
            this._witClient.CreateNewItem(constants_1.WitTypes.Bug, taskTitle);
        }
        else {
            this._manager.DisplayErrorMessage();
        }
    }
    //Opens a browser to a new pull request for the current branch
    OpenNewPullRequest() {
        if (this._manager.EnsureInitialized(repositorycontext_1.RepositoryType.GIT)) {
            if (this._gitClient) {
                this._gitClient.OpenNewPullRequest(this._manager.RepoContext.RemoteUrl, this._manager.RepoContext.CurrentBranch);
            }
        }
        else {
            this._manager.DisplayErrorMessage();
        }
    }
    //Opens a browser to a new Task
    OpenNewTask() {
        if (this._manager.EnsureInitialized(repositorycontext_1.RepositoryType.ANY)) {
            //Issue is only in Agile and CMMI templates (not Scrum)
            //Task is in all three templates (Agile, CMMI, Scrum)
            const taskTitle = vscodeutils_1.VsCodeUtils.GetActiveSelection();
            this._witClient.CreateNewItem(constants_1.WitTypes.Task, taskTitle);
        }
        else {
            this._manager.DisplayErrorMessage();
        }
    }
    //Opens a browser to a new work item (based on the work item type selected)
    OpenNewWorkItem() {
        if (this._manager.EnsureInitialized(repositorycontext_1.RepositoryType.ANY)) {
            const taskTitle = vscodeutils_1.VsCodeUtils.GetActiveSelection();
            this._witClient.CreateNewWorkItem(taskTitle);
        }
        else {
            this._manager.DisplayErrorMessage();
        }
    }
    //Opens the team project web site
    OpenTeamProjectWebSite() {
        if (this._manager.EnsureInitialized(repositorycontext_1.RepositoryType.ANY)) {
            telemetry_1.Telemetry.SendEvent(constants_1.TelemetryEvents.OpenTeamSite);
            logger_1.Logger.LogInfo("OpenTeamProjectWebSite: " + this._manager.ServerContext.RepoInfo.TeamProjectUrl);
            utils_1.Utils.OpenUrl(this._manager.ServerContext.RepoInfo.TeamProjectUrl);
        }
        else {
            this._manager.DisplayErrorMessage();
        }
    }
    //Meant to be used when coming back online via status bar items
    RefreshPollingStatus() {
        if (this._manager.EnsureInitialized(repositorycontext_1.RepositoryType.ANY)) {
            this.refreshPollingItems();
        }
        else {
            this._manager.DisplayErrorMessage();
        }
    }
    //Returns the list of work items assigned directly to the current user
    ViewMyWorkItems() {
        if (this._manager.EnsureInitialized(repositorycontext_1.RepositoryType.ANY)) {
            this._witClient.ShowMyWorkItems();
        }
        else {
            this._manager.DisplayErrorMessage();
        }
    }
    //Returns the list of work items from the pinned query
    ViewPinnedQueryWorkItems() {
        if (this._manager.EnsureInitialized(repositorycontext_1.RepositoryType.ANY)) {
            this._witClient.ShowPinnedQueryWorkItems();
        }
        else {
            this._manager.DisplayErrorMessage();
        }
    }
    //Navigates to a work item chosen from the results of a user-selected "My Queries" work item query
    //This method first displays the queries under "My Queries" and, when one is chosen, displays the associated work items.
    //If a work item is chosen, it is opened in the web browser.
    ViewWorkItems() {
        if (this._manager.EnsureInitialized(repositorycontext_1.RepositoryType.ANY)) {
            this._witClient.ShowMyWorkItemQueries();
        }
        else {
            this._manager.DisplayErrorMessage();
        }
    }
    AssociateWorkItems() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._manager.EnsureInitialized(repositorycontext_1.RepositoryType.ANY)) {
                telemetry_1.Telemetry.SendEvent(constants_1.TelemetryEvents.AssociateWorkItems);
                const workitems = yield this.chooseWorkItems();
                for (let i = 0; i < workitems.length; i++) {
                    // Append the string to end of the message
                    // Note: we are prefixing the message with a space so that the # char is not in the first column
                    //       This helps in case the user ends up editing the comment from the Git command line
                    this.appendToCheckinMessage(" " + workitems[i]);
                }
            }
            else {
                this._manager.DisplayErrorMessage();
            }
        });
    }
    appendToCheckinMessage(line) {
        this.withSourceControlInputBox((inputBox) => {
            const previousMessage = inputBox.value;
            if (previousMessage) {
                inputBox.value = previousMessage + "\n" + line;
            }
            else {
                inputBox.value = line;
            }
        });
    }
    getDefaultUsername() {
        if (os.platform() === "win32") {
            let defaultUsername;
            const domain = process.env.USERDOMAIN || "";
            const username = process.env.USERNAME || "";
            if (domain !== undefined) {
                defaultUsername = domain;
            }
            if (username !== undefined) {
                if (defaultUsername === undefined) {
                    return username;
                }
                return defaultUsername + "\\" + username;
            }
        }
        return undefined;
    }
    //Set up the initial status bars
    InitializeStatusBars() {
        //Only initialize the status bar item if this is a Git repository
        if (this._manager.RepoContext.Type === repositorycontext_1.RepositoryType.GIT) {
            if (!this._pullRequestStatusBarItem) {
                this._pullRequestStatusBarItem = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Left, 99);
                this._pullRequestStatusBarItem.command = constants_1.CommandNames.GetPullRequests;
                this._pullRequestStatusBarItem.text = gitclient_1.GitClient.GetPullRequestStatusText();
                this._pullRequestStatusBarItem.tooltip = strings_1.Strings.BrowseYourPullRequests;
                this._pullRequestStatusBarItem.show();
            }
        }
        if (!this._buildStatusBarItem) {
            this._buildStatusBarItem = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Left, 98);
            this._buildStatusBarItem.command = constants_1.CommandNames.OpenBuildSummaryPage;
            this._buildStatusBarItem.text = `$(package) $(dash)`;
            this._buildStatusBarItem.tooltip = strings_1.Strings.NoBuildsFound;
            this._buildStatusBarItem.show();
        }
        if (!this._pinnedQueryStatusBarItem) {
            this._pinnedQueryStatusBarItem = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Left, 97);
            this._pinnedQueryStatusBarItem.command = constants_1.CommandNames.ViewPinnedQueryWorkItems;
            this._pinnedQueryStatusBarItem.text = witclient_1.WitClient.GetPinnedQueryStatusText();
            this._pinnedQueryStatusBarItem.tooltip = strings_1.Strings.ViewYourPinnedQuery;
            this._pinnedQueryStatusBarItem.show();
        }
    }
    InitializeClients(repoType) {
        //Ensure that the repo type is good to go before we initialize the clients for it. If we
        //can't get a team project for TFVC, we shouldn't initialize the clients.
        if (this._manager.EnsureInitialized(repoType)) {
            //We can initialize for any repo type (just skip _gitClient if not Git)
            this._pinnedQuerySettings = new settings_1.PinnedQuerySettings(this._manager.ServerContext.RepoInfo.Account);
            this._buildClient = new buildclient_1.BuildClient(this._manager.ServerContext, this._buildStatusBarItem);
            //Don't initialize the Git client if we aren't a Git repository
            if (repoType === repositorycontext_1.RepositoryType.GIT) {
                this._gitClient = new gitclient_1.GitClient(this._manager.ServerContext, this._pullRequestStatusBarItem);
            }
            this._witClient = new witclient_1.WitClient(this._manager.ServerContext, this._pinnedQuerySettings.PinnedQuery, this._pinnedQueryStatusBarItem);
            this.startPolling();
        }
    }
    //Returns a list of strings representing the work items that the user chose
    // strings are in the form "#id - description"
    chooseWorkItems() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._witClient.ChooseWorkItems();
        });
    }
    pollBuildStatus() {
        if (this._manager.EnsureInitialized(repositorycontext_1.RepositoryType.ANY)) {
            logger_1.Logger.LogInfo("Polling for latest current build status...");
            this._buildClient.DisplayCurrentBuildStatus(this._manager.RepoContext, true, this._manager.Settings.BuildDefinitionId);
        }
    }
    pollMyPullRequests() {
        //Since we're polling, we don't want to display an error every so often
        //if user opened a TFVC repository (via EnsureInitialized).  So send
        //ALL to EnsureInitialized but check it before actually polling.
        if (this._manager.EnsureInitialized(repositorycontext_1.RepositoryType.ANY)) {
            //Only poll for pull requests when repository is Git
            if (this._manager.RepoContext.Type === repositorycontext_1.RepositoryType.GIT) {
                logger_1.Logger.LogInfo("Polling for pull requests...");
                this._gitClient.PollMyPullRequests();
            }
        }
    }
    pollPinnedQuery() {
        if (this._manager.EnsureInitialized(repositorycontext_1.RepositoryType.ANY)) {
            logger_1.Logger.LogInfo("Polling for the pinned work itemquery");
            this._witClient.PollPinnedQuery();
        }
    }
    //Polls for latest pull requests and current branch build status information
    refreshPollingItems() {
        this.pollMyPullRequests();
        this.pollBuildStatus();
        this.pollPinnedQuery();
    }
    //Sets up the interval to refresh polling items
    startPolling() {
        if (!this._pollingTimer) {
            this._initialTimer = setTimeout(() => this.refreshPollingItems(), 1000 * 4);
            this._pollingTimer = setInterval(() => this.refreshPollingItems(), 1000 * 60 * this._manager.Settings.PollingInterval);
        }
    }
    /**
     * Exposes access to the source control input box for use in other areas.
     * @param fn A function that works with the input box.
     */
    withSourceControlInputBox(fn) {
        const gitExtension = vscode.extensions.getExtension("vscode.git");
        if (gitExtension) {
            const git = gitExtension.exports;
            if (git) {
                git.getRepositories()
                    .then((repos) => {
                    if (repos && repos.length > 0) {
                        const inputBox = repos[0].inputBox;
                        if (inputBox) {
                            fn(inputBox);
                        }
                    }
                });
            }
        }
    }
    NotifyBranchChanged() {
        this.refreshPollingItems();
    }
    cleanup() {
        if (this._pollingTimer) {
            if (this._initialTimer) {
                clearTimeout(this._initialTimer);
                this._initialTimer = undefined;
            }
            clearInterval(this._pollingTimer);
            this._pollingTimer = undefined;
        }
        if (this._pullRequestStatusBarItem !== undefined) {
            this._pullRequestStatusBarItem.dispose();
            this._pullRequestStatusBarItem = undefined;
        }
        if (this._buildStatusBarItem !== undefined) {
            this._buildStatusBarItem.dispose();
            this._buildStatusBarItem = undefined;
        }
        if (this._pinnedQueryStatusBarItem !== undefined) {
            this._pinnedQueryStatusBarItem.dispose();
            this._pinnedQueryStatusBarItem = undefined;
        }
    }
    dispose() {
        this.cleanup();
    }
}
exports.TeamExtension = TeamExtension;

//# sourceMappingURL=team-extension.js.map
