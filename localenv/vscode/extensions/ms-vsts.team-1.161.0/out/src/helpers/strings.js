/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable:variable-name */
class Strings {
}
Strings.ViewYourPinnedQuery = "View your pinned work item query results.";
Strings.BrowseYourPullRequests = "Browse your pull requests.";
Strings.BrowseAdditionalWorkItems = "Browse additional work items...";
Strings.BrowseAdditionalWorkItemsDescription = "Choose this item to see all query results in your web browser";
Strings.FolderNotOpened = "You must open a repository folder in order to use the Azure Repos extension.";
Strings.NavigateToBuildSummary = "Click to view build";
Strings.NavigateToTeamServicesWebSite = "Click to view your team project website.";
Strings.NoAccessTokenFound = "A personal access token for this repository hosted on Azure DevOps Services was not found in your local user settings.";
Strings.NoAccessTokenLearnMoreRunSignin = "You are not connected to Azure DevOps Services (%s). Select 'Learn more...' and then run the 'team signin' command.";
Strings.NoAccessTokenRunSignin = "You are not connected to Azure DevOps Services (%s). Please run the 'team signin' command.";
Strings.NoTeamServerCredentialsRunSignin = "You are not connected to a Team Foundation Server. Please run the 'team signin' command.";
Strings.NoBuildsFound = "No builds were found for this repository and branch. Click to view your team project's build definitions page.";
Strings.NoTfvcBuildsFound = "No builds were found for this repository. Click to view your team project's build definitions page.";
Strings.NoRepoInformation = "No Azure DevOps Services or Team Foundation Server repository configuration was found. Ensure you've opened a folder that contains a repository.";
Strings.NoSourceFileForBlame = "A source file must be opened to show blame information.";
Strings.UserMustSignIn = "You are signed out. Please run the 'team signin' command.";
Strings.DeviceFlowAuthenticatingToTeamServices = "Authenticating to Azure DevOps Services (%s)...";
Strings.DeviceFlowCopyCode = "Copy this code and then press Enter to start the authentication process";
Strings.DeviceFlowManualPrompt = "Provide an access token manually (current experience)";
Strings.DeviceFlowPrompt = "Authenticate and get an access token automatically (new experience)";
Strings.DeviceFlowPlaceholder = "Choose your method of authenticating to Azure DevOps Services...";
Strings.ErrorRequestingToken = "An error occurred requesting a personal access token for %s.";
Strings.SendAFrown = "Send a Frown";
Strings.SendASmile = "Send a Smile";
Strings.SendFeedback = "Send us feedback about the Azure Repos extension!";
Strings.SendFeedbackPrompt = "Enter your feedback here (1000 char limit)";
Strings.NoFeedbackSent = "No feedback was sent.";
Strings.ThanksForFeedback = "Thanks for sending feedback!";
Strings.LearnMore = "Learn More...";
Strings.LearnMoreAboutTfvc = "TFVC Support...";
Strings.MoreDetails = "More Details...";
Strings.SetupTfvcSupport = "Set Up TFVC Support...";
Strings.ShowMe = "Show Me!";
Strings.VS2015Update3CSR = "Get Latest VS 2015 Update";
Strings.DontShowAgain = "Don't Show Again";
Strings.ChoosePullRequest = "Choose a pull request";
Strings.ChooseWorkItem = "Choose a work item";
Strings.ChooseWorkItemQuery = "Choose a work item query";
Strings.ChooseWorkItemType = "Choose a work item type";
Strings.ClickToRetryConnection = "Click to retry.";
Strings.ProvideAccessToken = "Provide the personal access token for your organization";
Strings.ProvidePassword = "Provide the password for username";
Strings.ProvideUsername = "Provide the username for server";
Strings.UnsupportedWitServerVersion = "Work Item Tracking (WIT) functionality is disabled. WIT functionality requires TFS version 2015 Update 2 or later.";
Strings.UnsupportedServerVersion = "The Azure Repos extension only supports TFS version 2015 Update 2 or later. Please verify your TFS server version.";
Strings.UnableToRemoveCredentials = "Unable to remove credentials for this host. You may need to remove them manually. Host: ";
Strings.UnableToStoreCredentials = "Unable to store credentials for this host. Host: ";
Strings.UnableToValidateTeamServicesCollection = "Unable to validate the Azure DevOps Services collection.";
Strings.UnableToValidateCollectionAssumingDefaultCollection = "Unable to validate the collection assuming 'DefaultCollection'.";
//Status codes
Strings.StatusCode401 = "Unauthorized. Check your authentication credentials and try again.";
Strings.StatusCodeOffline = "It appears Visual Studio Code is offline. Please connect and try again.";
Strings.ProxyUnreachable = "It appears the configured proxy is not reachable. Please check your connection and try again.";
// TFVC messages/errors
Strings.ChooseItemQuickPickPlaceHolder = "Choose a file to open it.";
Strings.NotAGitRepository = "The open folder is not a Git repository. Please check the folder location and try again.";
Strings.NotATfvcRepository = "The open folder is not a TFVC repository. Please check the folder location and try again.";
Strings.NotAnEnuTfCommandLine = "It appears you have configured a non-English version of the TF executable. Please ensure an English version is properly configured.";
Strings.TokenNotAllScopes = "The personal access token provided does not have All Scopes. All Scopes is required for TFVC support.";
Strings.TfvcLocationMissingError = "The path to the TFVC command line (including filename) was not found in the user settings. Please set this value (tfvc.location) and try again.";
Strings.TfMissingError = "Unable to find the TF executable. Please ensure TF is installed and the path specified contains the filename.";
Strings.TfInitializeFailureError = "Unable to initialize the TF executable. Please verify the installation of Java and ensure it is in the PATH.";
Strings.TfExecFailedError = "Execution of the TFVC command line failed unexpectedly.";
Strings.TfVersionWarning = "The configured version of TF does not meet the minimum version. You may run into errors or limitations with certain commands until you upgrade. Minimum version: ";
Strings.TfNoPendingChanges = "There are no matching pending changes.";
Strings.TfServerWorkspace = "It appears you are using a Server workspace. Currently, TFVC support is limited to Local workspaces.";
Strings.ClcCannotAccessWorkspace = "It appears you are using the TEE CLC and are unable to access an existing workspace. The TFVC SCM Provider cannot be initialized. Click 'More details...' to learn more.";
Strings.UndoChanges = "Undo Changes";
Strings.DeleteFile = "Delete File";
Strings.NoChangesToCheckin = "There are no changes to check in. Changes must be added to the 'Included' section to be checked in.";
Strings.NoChangesToUndo = "There are no changes to undo.";
Strings.AllFilesUpToDate = "All files are up to date.";
Strings.CommandRequiresFileContext = "This command requires a file context and can only be executed from the TFVC viewlet window.";
Strings.CommandRequiresExplorerContext = "This command requires a file context and can only be executed from the Explorer window.";
Strings.RenamePrompt = "Provide the new name for the file.";
Strings.NoMatchesFound = "No items match any of the file paths provided.";
Strings.NoTeamProjectFound = "No team project found for this repository. Build and Work Item functionality has been disabled.";
Strings.NoWorkspaceMappings = "Could not find a workspace with mappings (e.g., not a TFVC repository, wrong version of TF is being used).";
Strings.ShowTfvcOutput = "Show TFVC Output";
// TFVC viewlet Strings
Strings.ExcludedGroupName = "Excluded changes";
Strings.IncludedGroupName = "Included changes";
Strings.ConflictsGroupName = "Conflicting changes";
// TFVC Sync Types
Strings.SyncTypeConflict = "Conflict";
Strings.SyncTypeDeleted = "Deleted";
Strings.SyncTypeError = "Error";
Strings.SyncTypeNew = "New";
Strings.SyncTypeUpdated = "Updated";
Strings.SyncTypeWarning = "Warning";
// TFVC Conflict Titles
Strings.ConflictAlreadyDeleted = "ALREADY DELETED";
Strings.ConflictAlreadyExists = "ALREADY EXISTS";
Strings.ConflictDeletedLocally = "DELETED LOCALLY";
// TFVC AutoResolveType Strings
Strings.AutoResolveTypeAutoMerge = "Auto Merge";
Strings.AutoResolveTypeDeleteConflict = "Delete Conflict";
Strings.AutoResolveTypeKeepYours = "Keep Yours";
Strings.AutoResolveTypeKeepYoursRenameTheirs = "Keep Yours Rename Theirs";
Strings.AutoResolveTypeOverwriteLocal = "Overwrite Local";
Strings.AutoResolveTypeTakeTheirs = "Take Theirs";
exports.Strings = Strings;

//# sourceMappingURL=strings.js.map
