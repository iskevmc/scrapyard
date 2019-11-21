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
const strings_1 = require("../../helpers/strings");
const constants_1 = require("../../helpers/constants");
const argumentbuilder_1 = require("./argumentbuilder");
const commandhelper_1 = require("./commandhelper");
const tfvcerror_1 = require("../tfvcerror");
/**
 * This command only returns a partial workspace object that allows you to get the name and server.
 * To get the entire workspace object you should call GetWorkspace with the workspace name.
 * (This is one of the only commands that expects to be a strictly local operation - no server calls - and so does not
 * take a server context object in the constructor)
 */
class FindWorkspace {
    constructor(localPath, restrictWorkspace = false) {
        commandhelper_1.CommandHelper.RequireStringArgument(localPath, "localPath");
        this._localPath = localPath;
        this._restrictWorkspace = restrictWorkspace;
    }
    GetArguments() {
        // Due to a bug in the CLC this command "requires" the login switch although the creds are never used
        const builder = new argumentbuilder_1.ArgumentBuilder("workfold");
        //If desired, restrict the workspace to the localPath (VS Code's current workspace)
        if (this._restrictWorkspace) {
            //With TEE, I got an error when passing "login", "fake,fake" and the path at the same time.
            // A client error occurred: Error refreshing cached workspace WorkspaceInfo (*snip*) from server:
            // Access denied connecting to TFS server http://java-tfs2015:8081/ (authenticating as fake)
            //TF.exe is fine without the fake login when a localPath is provided
            return builder.Add(this._localPath);
        }
        return builder.AddSwitchWithValue("login", "fake,fake", true);
    }
    GetOptions() {
        return { cwd: this._localPath };
    }
    /**
     * Parses the output of the workfold command. (NOT XML)
     * SAMPLE
     * Access denied connecting to TFS server https://account.visualstudio.com/ (authenticating as Personal Access Token)  <-- line is optional
     * =====================================================================================================================================================
     * Workspace:  MyNewWorkspace2
     * Collection: http://java-tfs2015:8081/tfs/
     * $/tfsTest_01: D:\tmp\test
     */
    ParseOutput(executionResult) {
        return __awaiter(this, void 0, void 0, function* () {
            // Throw if any errors are found in stderr or if exitcode is not 0
            commandhelper_1.CommandHelper.ProcessErrors(executionResult);
            const stdout = executionResult.stdout;
            if (!stdout) {
                return undefined;
            }
            // Find the workspace name and collectionUrl
            const lines = commandhelper_1.CommandHelper.SplitIntoLines(stdout);
            let workspaceName = "";
            let collectionUrl = "";
            let equalsLineFound = false;
            const mappings = [];
            let teamProject = undefined;
            for (let i = 0; i <= lines.length; i++) {
                const line = lines[i];
                if (!line) {
                    continue;
                }
                if (line.startsWith("==========")) {
                    equalsLineFound = true;
                    continue;
                }
                else if (!equalsLineFound) {
                    continue;
                }
                //CLC returns 'Workspace:', tf.exe returns 'Workspace :'
                if (line.startsWith("Workspace:") || line.startsWith("Workspace :")) {
                    workspaceName = this.getValue(line);
                }
                else if (line.startsWith("Collection:")) {
                    collectionUrl = this.getValue(line);
                }
                else {
                    // This should be a mapping
                    const mapping = this.getMapping(line);
                    if (mapping) {
                        mappings.push(mapping);
                        //If we're restricting workspaces, tf.exe will return the proper (single) folder. While TEE will
                        //return all of the mapped folders (so we have to find the right one based on the folder name passed in)
                        //We will do that further down but this sets up the default for that scenario.
                        if (!teamProject) {
                            teamProject = this.getTeamProject(mapping.serverPath);
                        }
                    }
                }
            }
            if (mappings.length === 0) {
                throw new tfvcerror_1.TfvcError({
                    message: strings_1.Strings.NoWorkspaceMappings,
                    tfvcErrorCode: tfvcerror_1.TfvcErrorCodes.NotATfvcRepository
                });
            }
            //If we're restricting the workspace, find the proper teamProject name
            if (this._restrictWorkspace) {
                for (let i = 0; i < mappings.length; i++) {
                    const isWithin = this.pathIsWithin(this._localPath, mappings[i].localPath);
                    if (isWithin) {
                        const project = this.getTeamProject(mappings[i].serverPath); //maintain case in serverPath
                        teamProject = project;
                        break;
                    }
                }
            }
            //If there are mappings but no workspace name, the term 'workspace' couldn't be parsed. According to Bing
            //translate, other than Klingon, no other supported language translates 'workspace' as 'workspace'.
            //So if we determine there are mappings but can't get the workspace name, we assume it's a non-ENU
            //tf executable. One example of this is German.
            if (mappings.length > 0 && !workspaceName) {
                const messageOptions = [{ title: strings_1.Strings.MoreDetails,
                        url: constants_1.Constants.NonEnuTfExeConfiguredUrl,
                        telemetryId: constants_1.TfvcTelemetryEvents.ExeNonEnuConfiguredMoreDetails }];
                throw new tfvcerror_1.TfvcError({
                    message: strings_1.Strings.NotAnEnuTfCommandLine,
                    messageOptions: messageOptions,
                    tfvcErrorCode: tfvcerror_1.TfvcErrorCodes.NotAnEnuTfCommandLine
                });
            }
            //Decode collectionURL and teamProject here (for cases like 'Collection: http://java-tfs2015:8081/tfs/spaces%20in%20the%20name')
            const workspace = {
                name: workspaceName,
                server: decodeURI(collectionUrl),
                defaultTeamProject: decodeURI(teamProject),
                mappings: mappings
            };
            return workspace;
        });
    }
    GetExeArguments() {
        return this.GetArguments();
    }
    GetExeOptions() {
        return this.GetOptions();
    }
    /**
     * Parses the output of the workfold command (the EXE output is slightly different from the CLC output parsed above)
     * SAMPLE
     * Access denied connecting to TFS server https://account.visualstudio.com/ (authenticating as Personal Access Token)  <-- line is optional
     * =====================================================================================================================================================
     * Workspace : MyNewWorkspace2 (user name)
     * Collection: http://server:8081/tfs/
     * $/tfsTest_01: D:\tmp\test
     */
    ParseExeOutput(executionResult) {
        return __awaiter(this, void 0, void 0, function* () {
            const workspace = yield this.ParseOutput(executionResult);
            if (workspace && workspace.name) {
                // The workspace name includes the user name, so let's fix that
                const lastOpenParenIndex = workspace.name.lastIndexOf(" (");
                if (lastOpenParenIndex >= 0) {
                    workspace.name = workspace.name.slice(0, lastOpenParenIndex).trim();
                }
            }
            return workspace;
        });
    }
    /**
     * This method parses a line of the form "name: value" and returns the value part.
     */
    getValue(line) {
        if (line) {
            const index = line.indexOf(":");
            if (index >= 0 && index + 1 < line.length) {
                return line.slice(index + 1).trim();
            }
        }
        return "";
    }
    /**
     * This method parses a single line of output returning the mapping if one was found
     * Examples:
     * "$/TFVC_11/folder1: D:\tmp\notdefault\folder1"
     * "(cloaked) $/TFVC_11/folder1:"
     */
    getMapping(line) {
        if (line) {
            const cloaked = line.trim().toLowerCase().startsWith("(cloaked)");
            let end = line.indexOf(":");
            //EXE: cloaked entries end with ':'
            //CLC: cloaked entries *don't* end with ':'
            if (cloaked && end === -1) {
                end = line.length;
            }
            const start = cloaked ? line.indexOf(")") + 1 : 0;
            const serverPath = line.slice(start, end).trim();
            let localPath;
            //cloaked entries don't have local paths
            if (end >= 0 && end + 1 < line.length) {
                localPath = line.slice(end + 1).trim();
            }
            return {
                serverPath: serverPath,
                localPath: localPath,
                cloaked: cloaked
            };
        }
        return undefined;
    }
    /**
     * Use this method to get the team project name from a TFVC server path.
     * The team project name is always the first folder in the path.
     * If no team project name is found an empty string is returned.
     */
    getTeamProject(serverPath) {
        if (serverPath && serverPath.startsWith("$/") && serverPath.length > 2) {
            const index = serverPath.indexOf("/", 2);
            if (index > 0) {
                return serverPath.slice(2, index);
            }
            else {
                return serverPath.slice(2);
            }
        }
        return "";
    }
    //Checks to see if the openedPath (in VS Code) is within the workspacePath
    //specified in the workspace. The funcation needs to ensure we get the
    //"best" (most specific) match.
    pathIsWithin(openedPath, workspacePath) {
        //Replace all backslashes with forward slashes on both paths
        openedPath = openedPath.replace(/\\/g, "/");
        workspacePath = workspacePath.replace(/\\/g, "/");
        //Add trailing separators to ensure they're included in the lastIndexOf
        //(e.g., to ensure we match "/path2" with "/path2" and not "/path2" with "/path" first)
        openedPath = this.addTrailingSeparator(openedPath, "/");
        workspacePath = this.addTrailingSeparator(workspacePath, "/");
        //Lowercase both paths (TFVC should be case-insensitive)
        openedPath = openedPath.toLowerCase();
        workspacePath = workspacePath.toLowerCase();
        return openedPath.startsWith(workspacePath);
    }
    ;
    //If the path doesn't end with a separator, add one
    addTrailingSeparator(path, separator) {
        if (path[path.length - 1] !== separator) {
            return path += separator;
        }
        return path;
    }
}
exports.FindWorkspace = FindWorkspace;

//# sourceMappingURL=findworkspace.js.map
