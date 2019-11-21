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
const logger_1 = require("../helpers/logger");
const tfcommandlinerunner_1 = require("./tfcommandlinerunner");
const add_1 = require("./commands/add");
const checkin_1 = require("./commands/checkin");
const delete_1 = require("./commands/delete");
const findconflicts_1 = require("./commands/findconflicts");
const findworkspace_1 = require("./commands/findworkspace");
const getinfo_1 = require("./commands/getinfo");
const getfilecontent_1 = require("./commands/getfilecontent");
const getversion_1 = require("./commands/getversion");
const rename_1 = require("./commands/rename");
const resolveconflicts_1 = require("./commands/resolveconflicts");
const status_1 = require("./commands/status");
const sync_1 = require("./commands/sync");
const undo_1 = require("./commands/undo");
const tfvcsettings_1 = require("./tfvcsettings");
const _ = require("underscore");
/**
 * The Repository class allows you to perform TFVC commands on the workspace represented
 * by the repositoryRootFolder.
 */
class TfvcRepository {
    constructor(serverContext, tfCommandLine, repositoryRootFolder, env = {}, isExe) {
        this._versionAlreadyChecked = false;
        this._isExe = false;
        logger_1.Logger.LogDebug(`TFVC Repository created with repositoryRootFolder='${repositoryRootFolder}'`);
        this._serverContext = serverContext;
        this._tfCommandLine = tfCommandLine;
        this._repositoryRootFolder = repositoryRootFolder;
        this._env = env;
        this._isExe = isExe;
        this._settings = new tfvcsettings_1.TfvcSettings();
        // Add the environment variables that we need to make sure the CLC runs as fast as possible and
        // provides English strings back to us to parse.
        this._env.TF_NOTELEMETRY = "TRUE";
        this._env.TF_ADDITIONAL_JAVA_ARGS = "-Duser.country=US -Duser.language=en";
    }
    get TfvcLocation() {
        return this._tfCommandLine.path;
    }
    get HasContext() {
        return this._serverContext !== undefined && this._serverContext.CredentialInfo !== undefined && this._serverContext.RepoInfo.CollectionUrl !== undefined;
    }
    get IsExe() {
        return this._isExe;
    }
    get Path() {
        return this._repositoryRootFolder;
    }
    get RestrictWorkspace() {
        return this._settings.RestrictWorkspace;
    }
    Add(itemPaths) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.Logger.LogDebug(`TFVC Repository.Add`);
            return this.RunCommand(new add_1.Add(this._serverContext, itemPaths));
        });
    }
    Checkin(files, comment, workItemIds) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.Logger.LogDebug(`TFVC Repository.Checkin`);
            return this.RunCommand(new checkin_1.Checkin(this._serverContext, files, comment, workItemIds));
        });
    }
    Delete(itemPaths) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.Logger.LogDebug(`TFVC Repository.Delete`);
            return this.RunCommand(new delete_1.Delete(this._serverContext, itemPaths));
        });
    }
    FindConflicts(itemPath) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.Logger.LogDebug(`TFVC Repository.FindConflicts`);
            return this.RunCommand(new findconflicts_1.FindConflicts(this._serverContext, itemPath ? itemPath : this._repositoryRootFolder));
        });
    }
    FindWorkspace(localPath) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.Logger.LogDebug(`TFVC Repository.FindWorkspace with localPath='${localPath}'`);
            return this.RunCommand(new findworkspace_1.FindWorkspace(localPath, this._settings.RestrictWorkspace));
        });
    }
    GetInfo(itemPaths) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.Logger.LogDebug(`TFVC Repository.GetInfo`);
            return this.RunCommand(new getinfo_1.GetInfo(this._serverContext, itemPaths));
        });
    }
    GetFileContent(itemPath, versionSpec) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.Logger.LogDebug(`TFVC Repository.GetFileContent`);
            return this.RunCommand(new getfilecontent_1.GetFileContent(this._serverContext, itemPath, versionSpec, true));
        });
    }
    GetStatus(ignoreFiles) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.Logger.LogDebug(`TFVC Repository.GetStatus`);
            let statusCommand = new status_1.Status(this._serverContext, ignoreFiles === undefined ? true : ignoreFiles);
            //If we're restricting the workspace, pass in the repository root folder to Status
            if (this._settings.RestrictWorkspace) {
                statusCommand = new status_1.Status(this._serverContext, ignoreFiles === undefined ? true : ignoreFiles, [this._repositoryRootFolder]);
            }
            return this.RunCommand(statusCommand);
        });
    }
    Rename(sourcePath, destinationPath) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.Logger.LogDebug(`TFVC Repository.Rename`);
            return this.RunCommand(new rename_1.Rename(this._serverContext, sourcePath, destinationPath));
        });
    }
    ResolveConflicts(itemPaths, autoResolveType) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.Logger.LogDebug(`TFVC Repository.ResolveConflicts`);
            return this.RunCommand(new resolveconflicts_1.ResolveConflicts(this._serverContext, itemPaths, autoResolveType));
        });
    }
    Sync(itemPaths, recursive) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.Logger.LogDebug(`TFVC Repository.Sync`);
            return this.RunCommand(new sync_1.Sync(this._serverContext, itemPaths, recursive));
        });
    }
    Undo(itemPaths) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.Logger.LogDebug(`TFVC Repository.Undo`);
            return this.RunCommand(new undo_1.Undo(this._serverContext, itemPaths));
        });
    }
    CheckVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._versionAlreadyChecked) {
                logger_1.Logger.LogDebug(`TFVC Repository.CheckVersion`);
                // Set the versionAlreadyChecked flag first in case one of the other lines throws
                this._versionAlreadyChecked = true;
                const version = yield this.RunCommand(new getversion_1.GetVersion());
                tfcommandlinerunner_1.TfCommandLineRunner.CheckVersion(this._tfCommandLine, version);
                return version;
            }
            return undefined;
        });
    }
    RunCommand(cmd) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._tfCommandLine.isExe) {
                //This is the tf.exe path
                const result = yield this.exec(cmd.GetExeArguments(), cmd.GetExeOptions());
                // We will call ParseExeOutput to give the command a chance to handle any specific errors itself.
                const output = yield cmd.ParseExeOutput(result);
                return output;
            }
            else {
                //This is the CLC path
                const result = yield this.exec(cmd.GetArguments(), cmd.GetOptions());
                // We will call ParseOutput to give the command a chance to handle any specific errors itself.
                const output = yield cmd.ParseOutput(result);
                return output;
            }
        });
    }
    exec(args, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            options.env = _.assign({}, options.env || {});
            options.env = _.assign(options.env, this._env);
            return yield tfcommandlinerunner_1.TfCommandLineRunner.Exec(this._tfCommandLine, this._repositoryRootFolder, args, options);
        });
    }
}
exports.TfvcRepository = TfvcRepository;

//# sourceMappingURL=tfvcrepository.js.map
