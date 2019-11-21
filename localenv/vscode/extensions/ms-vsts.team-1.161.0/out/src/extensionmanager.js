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
const settings_1 = require("./helpers/settings");
const constants_1 = require("./helpers/constants");
const credentialmanager_1 = require("./helpers/credentialmanager");
const logger_1 = require("./helpers/logger");
const strings_1 = require("./helpers/strings");
const useragentprovider_1 = require("./helpers/useragentprovider");
const utils_1 = require("./helpers/utils");
const vscodeutils_1 = require("./helpers/vscodeutils");
const repocontextfactory_1 = require("./contexts/repocontextfactory");
const repositorycontext_1 = require("./contexts/repositorycontext");
const servercontext_1 = require("./contexts/servercontext");
const telemetry_1 = require("./services/telemetry");
const teamservicesclient_1 = require("./clients/teamservicesclient");
const feedbackclient_1 = require("./clients/feedbackclient");
const repositoryinfoclient_1 = require("./clients/repositoryinfoclient");
const userinfo_1 = require("./info/userinfo");
const team_extension_1 = require("./team-extension");
const tfcommandlinerunner_1 = require("./tfvc/tfcommandlinerunner");
const tfvc_extension_1 = require("./tfvc/tfvc-extension");
const tfvcerror_1 = require("./tfvc/tfvcerror");
const tfvcscmprovider_1 = require("./tfvc/tfvcscmprovider");
const path = require("path");
const util = require("util");
class ExtensionManager {
    Initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.setupFileSystemWatcherOnConfig();
            yield this.initializeExtension(false /*reinitializing*/);
            // Add the event listener for settings changes, then re-initialized the extension
            if (vscode_1.workspace) {
                vscode_1.workspace.onDidChangeConfiguration(() => {
                    logger_1.Logger.LogDebug("Reinitializing due to onDidChangeConfiguration");
                    //FUTURE: Check to see if we really need to do the re-initialization
                    this.Reinitialize();
                });
            }
        });
    }
    get RepoContext() {
        return this._repoContext;
    }
    get ServerContext() {
        return this._serverContext;
    }
    get CredentialManager() {
        return this._credentialManager;
    }
    get FeedbackClient() {
        return this._feedbackClient;
    }
    get Settings() {
        return this._settings;
    }
    get Team() {
        return this._teamExtension;
    }
    get Tfvc() {
        return this._tfvcExtension;
    }
    //Meant to reinitialize the extension when coming back online
    Reinitialize() {
        this.cleanup(true);
        this.initializeExtension(true /*reinitializing*/);
    }
    SendFeedback() {
        //SendFeedback doesn't need to ensure the extension is initialized
        feedbackclient_1.FeedbackClient.SendFeedback();
    }
    //Ensure we have a TFS or Team Services-based repository. Otherwise, return false.
    ensureMinimalInitialization() {
        if (!this._repoContext
            || !this._serverContext
            || !this._serverContext.RepoInfo.IsTeamFoundation) {
            //If the user previously signed out (in this session of VS Code), show a message to that effect
            if (this._teamExtension.IsSignedOut) {
                this.setErrorStatus(strings_1.Strings.UserMustSignIn, constants_1.CommandNames.Signin);
            }
            else {
                this.setErrorStatus(strings_1.Strings.NoRepoInformation);
            }
            return false;
        }
        return true;
    }
    //Checks to ensure we're good to go for running TFVC commands
    EnsureInitializedForTFVC() {
        return this.ensureMinimalInitialization();
    }
    //Checks to ensure that Team Services functionality is ready to go.
    EnsureInitialized(expectedType) {
        //Ensure we have a TFS or Team Services-based repository. Otherwise, return false.
        if (!this.ensureMinimalInitialization()) {
            return false;
        }
        //If we aren't the expected type and we also aren't ANY, determine which error to show.
        //If we aren't ANY, then this If will handle Git and TFVC. So if we get past the first
        //if, we're returning false either for Git or for TFVC (there's no other option)
        if (expectedType !== this._repoContext.Type && expectedType !== repositorycontext_1.RepositoryType.ANY) {
            //If we already have an error message set, we're in an error state and use that message
            if (this._errorMessage) {
                return false;
            }
            //Display the message straightaway in this case (instead of using status bar)
            if (expectedType === repositorycontext_1.RepositoryType.GIT) {
                vscodeutils_1.VsCodeUtils.ShowErrorMessage(strings_1.Strings.NotAGitRepository);
                return false;
            }
            if (expectedType === repositorycontext_1.RepositoryType.TFVC) {
                vscodeutils_1.VsCodeUtils.ShowErrorMessage(strings_1.Strings.NotATfvcRepository);
                return false;
            }
        }
        //For TFVC, without a TeamProjectName, we can't initialize the Team Services functionality
        if ((expectedType === repositorycontext_1.RepositoryType.TFVC || expectedType === repositorycontext_1.RepositoryType.ANY)
            && this._repoContext.Type === repositorycontext_1.RepositoryType.TFVC
            && !this._repoContext.TeamProjectName) {
            this.setErrorStatus(strings_1.Strings.NoTeamProjectFound);
            return false;
        }
        //Finally, if we set a global error message, there's an issue so we can't initialize.
        if (this._errorMessage !== undefined) {
            return false;
        }
        return true;
    }
    //Return value indicates whether a message was displayed
    DisplayErrorMessage(message) {
        const msg = message ? message : this._errorMessage;
        if (msg) {
            vscodeutils_1.VsCodeUtils.ShowErrorMessage(msg);
            return true;
        }
        return false;
    }
    DisplayWarningMessage(message) {
        vscodeutils_1.VsCodeUtils.ShowWarningMessage(message);
    }
    //Logs an error to the logger and sends an exception to telemetry service
    ReportError(err, message, showToUser = false) {
        const fullMessage = err ? message + " " + err : message;
        // Log the message
        logger_1.Logger.LogError(fullMessage);
        if (err && err.message) {
            // Log additional information for debugging purposes
            logger_1.Logger.LogDebug(err.message);
        }
        // Show just the message to the user if needed
        if (showToUser) {
            this.DisplayErrorMessage(message);
        }
        // Send it to telemetry
        if (err !== undefined && (utils_1.Utils.IsUnauthorized(err) || utils_1.Utils.IsOffline(err) || utils_1.Utils.IsProxyIssue(err))) {
            //Don't log exceptions for Unauthorized, Offline or Proxy scenarios
            return;
        }
        telemetry_1.Telemetry.SendException(err);
    }
    //Ensures a folder is open before attempting to run any command already shown in
    //the Command Palette (and defined in package.json).
    RunCommand(funcToTry, ...args) {
        if (!vscode_1.workspace || !vscode_1.workspace.rootPath) {
            this.DisplayErrorMessage(strings_1.Strings.FolderNotOpened);
            return;
        }
        funcToTry(args);
    }
    displayNoCredentialsMessage() {
        let error = strings_1.Strings.NoTeamServerCredentialsRunSignin;
        let displayError = strings_1.Strings.NoTeamServerCredentialsRunSignin;
        const messageItems = [];
        if (this._serverContext.RepoInfo.IsTeamServices === true) {
            messageItems.push({ title: strings_1.Strings.LearnMore,
                url: constants_1.Constants.TokenLearnMoreUrl,
                telemetryId: constants_1.TelemetryEvents.TokenLearnMoreClick });
            messageItems.push({ title: strings_1.Strings.ShowMe,
                url: constants_1.Constants.TokenShowMeUrl,
                telemetryId: constants_1.TelemetryEvents.TokenShowMeClick });
            //Need different messages for popup message and status bar
            //Add the account name to the message to help the user
            error = util.format(strings_1.Strings.NoAccessTokenRunSignin, this._serverContext.RepoInfo.Account);
            displayError = util.format(strings_1.Strings.NoAccessTokenLearnMoreRunSignin, this._serverContext.RepoInfo.Account);
        }
        logger_1.Logger.LogError(error);
        this.setErrorStatus(error, constants_1.CommandNames.Signin);
        vscodeutils_1.VsCodeUtils.ShowErrorMessage(displayError, ...messageItems);
    }
    formatErrorLogMessage(err) {
        let logMsg = err.message;
        if (err.stderr) {
            logMsg = utils_1.Utils.FormatMessage(`${logMsg} ${err.stderr}`);
        }
        return logMsg;
    }
    initializeExtension(reinitializing) {
        return __awaiter(this, void 0, void 0, function* () {
            //Set version of VSCode on the UserAgentProvider
            useragentprovider_1.UserAgentProvider.VSCodeVersion = vscode_1.version;
            //Users could install without having a folder (workspace) open
            this._settings = new settings_1.Settings(); //We need settings before showing the Welcome message
            telemetry_1.Telemetry.Initialize(this._settings); //Need to initialize telemetry for showing welcome message
            if (!reinitializing) {
                yield this.showWelcomeMessage(); //Ensure we show the message before hooking workspace.onDidChangeConfiguration
            }
            //Don't initialize if we don't have a workspace
            if (!vscode_1.workspace || !vscode_1.workspace.rootPath) {
                return;
            }
            // Create the extensions
            this._teamExtension = new team_extension_1.TeamExtension(this);
            this._tfvcExtension = new tfvc_extension_1.TfvcExtension(this);
            //If Logging is enabled, the user must have used the extension before so we can enable
            //it here.  This will allow us to log errors when we begin processing TFVC commands.
            telemetry_1.Telemetry.SendEvent(constants_1.TelemetryEvents.Installed); //Send event that the extension is installed (even if not used)
            this.logStart(this._settings.LoggingLevel, vscode_1.workspace.rootPath);
            this._teamServicesStatusBarItem = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Left, 100);
            this._feedbackStatusBarItem = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Left, 96);
            try {
                //RepositoryContext has some initial information about the repository (what we can get without authenticating with server)
                this._repoContext = yield repocontextfactory_1.RepositoryContextFactory.CreateRepositoryContext(vscode_1.workspace.rootPath, this._settings);
                if (this._repoContext) {
                    this.showFeedbackItem();
                    this.setupFileSystemWatcherOnHead();
                    this._serverContext = new servercontext_1.TeamServerContext(this._repoContext.RemoteUrl);
                    //Now that we have a server context, we can update it on the repository context
                    repocontextfactory_1.RepositoryContextFactory.UpdateRepositoryContext(this._repoContext, this._serverContext);
                    this._feedbackClient = new feedbackclient_1.FeedbackClient();
                    this._credentialManager = new credentialmanager_1.CredentialManager();
                    this._credentialManager.GetCredentials(this._serverContext).then((creds) => __awaiter(this, void 0, void 0, function* () {
                        if (!creds || !creds.CredentialHandler) {
                            this.displayNoCredentialsMessage();
                            return;
                        }
                        else {
                            this._serverContext.CredentialInfo = creds;
                            telemetry_1.Telemetry.Initialize(this._settings, this._serverContext); //Re-initialize the telemetry with the server context information
                            logger_1.Logger.LogDebug("Started ApplicationInsights telemetry");
                            //Set up the client we need to talk to the server for more repository information
                            const repositoryInfoClient = new repositoryinfoclient_1.RepositoryInfoClient(this._repoContext, credentialmanager_1.CredentialManager.GetCredentialHandler());
                            logger_1.Logger.LogInfo("Getting repository information with repositoryInfoClient");
                            logger_1.Logger.LogDebug("RemoteUrl = " + this._repoContext.RemoteUrl);
                            try {
                                //At this point, we have either successfully called git.exe or tf.cmd (we just need to verify the remote urls)
                                //For Git repositories, we call vsts/info and get collection ids, etc.
                                //For TFVC, we have to (potentially) make multiple other calls to get collection ids, etc.
                                this._serverContext.RepoInfo = yield repositoryInfoClient.GetRepositoryInfo();
                                //Now we need to go and get the authorized user information
                                const connectionUrl = (this._serverContext.RepoInfo.IsTeamServices === true ? this._serverContext.RepoInfo.AccountUrl : this._serverContext.RepoInfo.CollectionUrl);
                                const accountClient = new teamservicesclient_1.TeamServicesApi(connectionUrl, [credentialmanager_1.CredentialManager.GetCredentialHandler()]);
                                logger_1.Logger.LogInfo("Getting connectionData with accountClient");
                                logger_1.Logger.LogDebug("connectionUrl = " + connectionUrl);
                                try {
                                    const settings = yield accountClient.connect();
                                    logger_1.Logger.LogInfo("Retrieved connectionData with accountClient");
                                    this.resetErrorStatus();
                                    this._serverContext.UserInfo = new userinfo_1.UserInfo(settings.authenticatedUser.id, settings.authenticatedUser.providerDisplayName, settings.authenticatedUser.customDisplayName);
                                    this.initializeStatusBars();
                                    yield this.initializeClients(this._repoContext.Type);
                                    this.sendStartupTelemetry();
                                    logger_1.Logger.LogInfo(`Sent extension start up telemetry`);
                                    logger_1.Logger.LogObject(settings);
                                    this.logDebugInformation();
                                }
                                catch (err) {
                                    this.setErrorStatus(utils_1.Utils.GetMessageForStatusCode(err, err.message), (err.statusCode === 401 ? constants_1.CommandNames.Signin : undefined));
                                    //Wrap err here to get a useful call stack
                                    this.ReportError(new Error(err), utils_1.Utils.GetMessageForStatusCode(err, err.message, "Failed to get results with accountClient: "));
                                }
                            }
                            catch (err) {
                                //TODO: With TFVC, creating a RepositoryInfo can throw (can't get project collection, can't get team project, etc.)
                                // We get a 404 on-prem if we aren't TFS 2015 Update 2 or later and 'core id' error with TFS 2013 RTM (and likely later)
                                if (this._serverContext.RepoInfo.IsTeamFoundationServer === true &&
                                    (err.statusCode === 404 || (err.message && err.message.indexOf("Failed to find api location for area: core id:") === 0))) {
                                    this.setErrorStatus(strings_1.Strings.UnsupportedServerVersion);
                                    logger_1.Logger.LogError(strings_1.Strings.UnsupportedServerVersion);
                                    telemetry_1.Telemetry.SendEvent(constants_1.TelemetryEvents.UnsupportedServerVersion);
                                }
                                else {
                                    this.setErrorStatus(utils_1.Utils.GetMessageForStatusCode(err, err.message), (err.statusCode === 401 ? constants_1.CommandNames.Signin : undefined));
                                    //Wrap err here to get a useful call stack
                                    this.ReportError(new Error(err), utils_1.Utils.GetMessageForStatusCode(err, err.message, "Failed call with repositoryClient: "));
                                }
                            }
                        }
                        // Now that everything else is ready, create the SCM provider
                        try {
                            if (this._repoContext.Type === repositorycontext_1.RepositoryType.TFVC) {
                                const tfvcContext = this._repoContext;
                                this.sendTfvcConfiguredTelemetry(tfvcContext.TfvcRepository);
                                logger_1.Logger.LogInfo(`Sent TFVC tooling telemetry`);
                                if (!this._scmProvider) {
                                    logger_1.Logger.LogDebug(`Initializing the TfvcSCMProvider`);
                                    this._scmProvider = new tfvcscmprovider_1.TfvcSCMProvider(this);
                                    yield this._scmProvider.Initialize();
                                    logger_1.Logger.LogDebug(`Initialized the TfvcSCMProvider`);
                                }
                                else {
                                    logger_1.Logger.LogDebug(`Re-initializing the TfvcSCMProvider`);
                                    yield this._scmProvider.Reinitialize();
                                    logger_1.Logger.LogDebug(`Re-initialized the TfvcSCMProvider`);
                                }
                                this.sendTfvcConnectedTelemetry(tfvcContext.TfvcRepository);
                            }
                        }
                        catch (err) {
                            logger_1.Logger.LogError(`Caught an exception during Tfvc SCM Provider initialization`);
                            const logMsg = this.formatErrorLogMessage(err);
                            logger_1.Logger.LogError(logMsg);
                            if (err.tfvcErrorCode) {
                                this.setErrorStatus(err.message);
                                //Dispose of the Build and WIT status bar items so they don't show up (they should be re-created once a new folder is opened)
                                this._teamExtension.cleanup();
                                if (this.shouldDisplayTfvcError(err.tfvcErrorCode)) {
                                    vscodeutils_1.VsCodeUtils.ShowErrorMessage(err.message, ...err.messageOptions);
                                }
                            }
                        }
                    })).fail((err) => {
                        this.setErrorStatus(utils_1.Utils.GetMessageForStatusCode(err, err.message), (err.statusCode === 401 ? constants_1.CommandNames.Signin : undefined));
                        //If we can't get a requestHandler, report the error via the feedbackclient
                        const message = utils_1.Utils.GetMessageForStatusCode(err, err.message, "Failed to get a credential handler");
                        logger_1.Logger.LogError(message);
                        telemetry_1.Telemetry.SendException(err);
                    });
                }
            }
            catch (err) {
                const logMsg = this.formatErrorLogMessage(err);
                logger_1.Logger.LogError(logMsg);
                //For now, don't report these errors via the FeedbackClient (TFVC errors could result from TfvcContext creation failing)
                if (!err.tfvcErrorCode || this.shouldDisplayTfvcError(err.tfvcErrorCode)) {
                    this.setErrorStatus(err.message);
                    vscodeutils_1.VsCodeUtils.ShowErrorMessage(err.message, ...err.messageOptions);
                }
            }
        });
    }
    //Sends the "StartUp" event based on repository type
    sendStartupTelemetry() {
        let event = constants_1.TelemetryEvents.StartUp;
        if (this._repoContext.Type === repositorycontext_1.RepositoryType.TFVC) {
            event = constants_1.TfvcTelemetryEvents.StartUp;
        }
        else if (this._repoContext.Type === repositorycontext_1.RepositoryType.EXTERNAL) {
            event = constants_1.TelemetryEvents.ExternalRepository;
        }
        telemetry_1.Telemetry.SendEvent(event);
    }
    //Sends telemetry based on values of the TfvcRepository (which TF tooling (Exe or CLC) is configured)
    sendTfvcConfiguredTelemetry(repository) {
        let event = constants_1.TfvcTelemetryEvents.ExeConfigured;
        if (!repository.IsExe) {
            event = constants_1.TfvcTelemetryEvents.ClcConfigured;
        }
        telemetry_1.Telemetry.SendEvent(event);
        //For now, this is simply an indication that users have configured that feature
        if (repository.RestrictWorkspace) {
            telemetry_1.Telemetry.SendEvent(constants_1.TfvcTelemetryEvents.RestrictWorkspace);
        }
    }
    //Sends telemetry based on values of the TfvcRepository (which TF tooling (Exe or CLC) was connected)
    sendTfvcConnectedTelemetry(repository) {
        let event = constants_1.TfvcTelemetryEvents.ExeConnected;
        if (!repository.IsExe) {
            event = constants_1.TfvcTelemetryEvents.ClcConnected;
        }
        telemetry_1.Telemetry.SendEvent(event);
    }
    //Determines which Tfvc errors to display in the status bar ui
    shouldDisplayTfvcError(errorCode) {
        if (tfvcerror_1.TfvcErrorCodes.MinVersionWarning === errorCode ||
            tfvcerror_1.TfvcErrorCodes.NotFound === errorCode ||
            tfvcerror_1.TfvcErrorCodes.NotAuthorizedToAccess === errorCode ||
            tfvcerror_1.TfvcErrorCodes.NotAnEnuTfCommandLine === errorCode ||
            tfvcerror_1.TfvcErrorCodes.WorkspaceNotKnownToClc === errorCode) {
            return true;
        }
        return false;
    }
    //Ensure this is async (and is awaited on) so that the extension doesn't continue until user deals with message
    showWelcomeMessage() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._settings.ShowWelcomeMessage) {
                const welcomeMessage = `Welcome to version ${constants_1.Constants.ExtensionVersion} of the Azure Repos extension!`;
                const messageItems = [];
                messageItems.push({ title: strings_1.Strings.LearnMore,
                    url: constants_1.Constants.ReadmeLearnMoreUrl,
                    telemetryId: constants_1.TelemetryEvents.WelcomeLearnMoreClick });
                messageItems.push({ title: strings_1.Strings.SetupTfvcSupport,
                    url: constants_1.Constants.TfvcLearnMoreUrl,
                    telemetryId: constants_1.TfvcTelemetryEvents.SetupTfvcSupportClick });
                messageItems.push({ title: strings_1.Strings.DontShowAgain });
                const chosenItem = yield vscodeutils_1.VsCodeUtils.ShowInfoMessage(welcomeMessage, ...messageItems);
                if (chosenItem && chosenItem.title === strings_1.Strings.DontShowAgain) {
                    this._settings.ShowWelcomeMessage = false;
                }
            }
        });
    }
    //Set up the initial status bars
    initializeStatusBars() {
        if (this.ensureMinimalInitialization()) {
            this._teamServicesStatusBarItem.command = constants_1.CommandNames.OpenTeamSite;
            this._teamServicesStatusBarItem.text = this._serverContext.RepoInfo.TeamProject ? this._serverContext.RepoInfo.TeamProject : "<none>";
            this._teamServicesStatusBarItem.tooltip = strings_1.Strings.NavigateToTeamServicesWebSite;
            this._teamServicesStatusBarItem.show();
            if (this.EnsureInitialized(repositorycontext_1.RepositoryType.ANY)) {
                // Update the extensions
                this._teamExtension.InitializeStatusBars();
                //this._tfvcExtension.InitializeStatusBars();
            }
        }
    }
    //Set up the initial status bars
    initializeClients(repoType) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._teamExtension.InitializeClients(repoType);
            yield this._tfvcExtension.InitializeClients(repoType);
        });
    }
    logDebugInformation() {
        logger_1.Logger.LogDebug("Account: " + this._serverContext.RepoInfo.Account + " "
            + "Team Project: " + this._serverContext.RepoInfo.TeamProject + " "
            + "Collection: " + this._serverContext.RepoInfo.CollectionName + " "
            + "Repository: " + this._serverContext.RepoInfo.RepositoryName + " "
            + "UserCustomDisplayName: " + this._serverContext.UserInfo.CustomDisplayName + " "
            + "UserProviderDisplayName: " + this._serverContext.UserInfo.ProviderDisplayName + " "
            + "UserId: " + this._serverContext.UserInfo.Id + " ");
        logger_1.Logger.LogDebug("repositoryFolder: " + this._repoContext.RepoFolder);
        logger_1.Logger.LogDebug("repositoryRemoteUrl: " + this._repoContext.RemoteUrl);
        if (this._repoContext.Type === repositorycontext_1.RepositoryType.GIT) {
            logger_1.Logger.LogDebug("gitRepositoryParentFolder: " + this._repoContext.RepositoryParentFolder);
            logger_1.Logger.LogDebug("gitCurrentBranch: " + this._repoContext.CurrentBranch);
            logger_1.Logger.LogDebug("gitCurrentRef: " + this._repoContext.CurrentRef);
        }
        logger_1.Logger.LogDebug("IsSsh: " + this._repoContext.IsSsh);
        logger_1.Logger.LogDebug("proxy: " + (utils_1.Utils.IsProxyEnabled() ? "enabled" : "not enabled")
            + ", azure devops services: " + this._serverContext.RepoInfo.IsTeamServices.toString());
    }
    logStart(loggingLevel, rootPath) {
        if (loggingLevel === undefined) {
            return;
        }
        logger_1.Logger.SetLoggingLevel(loggingLevel);
        if (rootPath !== undefined) {
            logger_1.Logger.LogPath = rootPath;
            logger_1.Logger.LogInfo(`*** FOLDER: ${rootPath} ***`);
            logger_1.Logger.LogInfo(`${useragentprovider_1.UserAgentProvider.UserAgent}`);
        }
        else {
            logger_1.Logger.LogInfo(`*** Folder not opened ***`);
        }
    }
    resetErrorStatus() {
        this._errorMessage = undefined;
    }
    setErrorStatus(message, commandOnClick) {
        this._errorMessage = message;
        if (this._teamServicesStatusBarItem !== undefined) {
            //TODO: Should the default command be to display the message?
            this._teamServicesStatusBarItem.command = commandOnClick; // undefined clears the command
            this._teamServicesStatusBarItem.text = `Team $(stop)`;
            this._teamServicesStatusBarItem.tooltip = message;
            this._teamServicesStatusBarItem.show();
        }
    }
    //Sets up a file system watcher on HEAD so we can know when the current branch has changed
    setupFileSystemWatcherOnHead() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._repoContext && this._repoContext.Type === repositorycontext_1.RepositoryType.GIT) {
                const pattern = this._repoContext.RepoFolder + "/HEAD";
                const fsw = vscode_1.workspace.createFileSystemWatcher(pattern, true, false, true);
                fsw.onDidChange(() => __awaiter(this, void 0, void 0, function* () {
                    logger_1.Logger.LogInfo("HEAD has changed, re-parsing RepoContext object");
                    this._repoContext = yield repocontextfactory_1.RepositoryContextFactory.CreateRepositoryContext(vscode_1.workspace.rootPath, this._settings);
                    logger_1.Logger.LogInfo("CurrentBranch is: " + this._repoContext.CurrentBranch);
                    this.notifyBranchChanged();
                }));
            }
        });
    }
    notifyBranchChanged() {
        this._teamExtension.NotifyBranchChanged();
        //this._tfvcExtension.NotifyBranchChanged(currentBranch);
    }
    //Sets up a file system watcher on config so we can know when the remote origin has changed
    setupFileSystemWatcherOnConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            //If we don't have a workspace, don't set up the file watcher
            if (!vscode_1.workspace || !vscode_1.workspace.rootPath) {
                return;
            }
            if (this._repoContext && this._repoContext.Type === repositorycontext_1.RepositoryType.GIT) {
                const pattern = path.join(vscode_1.workspace.rootPath, ".git", "config");
                //We want to listen to file creation, change and delete events
                const fsw = vscode_1.workspace.createFileSystemWatcher(pattern, false, false, false);
                fsw.onDidCreate(() => {
                    //When a new local repo is initialized (e.g., git init), re-initialize the extension
                    logger_1.Logger.LogInfo("config has been created, re-initializing the extension");
                    this.Reinitialize();
                });
                fsw.onDidChange((uri) => __awaiter(this, void 0, void 0, function* () {
                    logger_1.Logger.LogInfo("config has changed, checking if 'remote origin' changed");
                    const context = yield repocontextfactory_1.RepositoryContextFactory.CreateRepositoryContext(uri.fsPath, this._settings);
                    const remote = context.RemoteUrl;
                    if (remote === undefined) {
                        //There is either no remote defined yet or it isn't a Team Services repo
                        if (this._repoContext.RemoteUrl !== undefined) {
                            //We previously had a Team Services repo and now we don't, reinitialize
                            logger_1.Logger.LogInfo("remote was removed, previously had an Azure Repos remote, re-initializing the extension");
                            this.Reinitialize();
                            return;
                        }
                        //There was no previous remote, so do nothing
                        logger_1.Logger.LogInfo("remote does not exist, no previous Azure Repos remote, nothing to do");
                    }
                    else if (this._repoContext !== undefined) {
                        //We have a valid gitContext already, check to see what changed
                        if (this._repoContext.RemoteUrl !== undefined) {
                            //The config has changed, and we had a Team Services remote already
                            if (remote.toLowerCase() !== this._repoContext.RemoteUrl.toLowerCase()) {
                                //And they're different, reinitialize
                                logger_1.Logger.LogInfo("remote changed to a different Azure Repos remote, re-initializing the extension");
                                this.Reinitialize();
                            }
                        }
                        else {
                            //The remote was initialized to a Team Services remote, reinitialize
                            logger_1.Logger.LogInfo("remote initialized to an Azure Repos remote, re-initializing the extension");
                            this.Reinitialize();
                        }
                    }
                }));
                fsw.onDidDelete(() => {
                    logger_1.Logger.LogInfo("config has been deleted, re-initializing the extension");
                    this.Reinitialize();
                });
            }
        });
    }
    showFeedbackItem() {
        this._feedbackStatusBarItem.command = constants_1.CommandNames.SendFeedback;
        this._feedbackStatusBarItem.text = `$(megaphone)`;
        this._feedbackStatusBarItem.tooltip = strings_1.Strings.SendFeedback;
        this._feedbackStatusBarItem.show();
    }
    cleanup(preserveTeamExtension = false) {
        if (this._teamServicesStatusBarItem) {
            this._teamServicesStatusBarItem.dispose();
            this._teamServicesStatusBarItem = undefined;
        }
        if (this._feedbackStatusBarItem !== undefined) {
            this._feedbackStatusBarItem.dispose();
            this._feedbackStatusBarItem = undefined;
        }
        //No matter if we're signing out or re-initializing, we need the team extension's
        //status bars and timers to be disposed but not the entire object
        this._teamExtension.cleanup();
        //If we are signing out, we need to keep some of the objects around
        if (!preserveTeamExtension && this._teamExtension) {
            this._teamExtension.dispose();
            this._teamExtension = undefined;
            this._serverContext = undefined;
            this._credentialManager = undefined;
            if (this._tfvcExtension) {
                this._tfvcExtension.dispose();
                this._tfvcExtension = undefined;
            }
            if (this._scmProvider) {
                this._scmProvider.dispose();
                this._scmProvider = undefined;
            }
            //Make sure we clean up any running instances of TF
            tfcommandlinerunner_1.TfCommandLineRunner.DisposeStatics();
        }
        //The following will be reset during a re-initialization
        this._repoContext = undefined;
        this._settings = undefined;
        this._errorMessage = undefined;
    }
    dispose() {
        this.cleanup();
    }
    //If we're signing out, we don't want to dispose of everything.
    SignOut() {
        this.cleanup(true);
    }
}
exports.ExtensionManager = ExtensionManager;

//# sourceMappingURL=extensionmanager.js.map
