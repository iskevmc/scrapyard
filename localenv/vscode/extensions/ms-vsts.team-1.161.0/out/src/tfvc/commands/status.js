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
const argumentbuilder_1 = require("./argumentbuilder");
const commandhelper_1 = require("./commandhelper");
const fs = require("fs");
/**
 * This command returns the status of the workspace as a list of pending changes.
 * NOTE: Currently this command does not support all of the options of the command line
 * <p/>
 * status [/workspace:<value>] [/shelveset:<value>] [/format:brief|detailed|xml] [/recursive] [/user:<value>] [/nodetect] [<itemSpec>...]
 */
class Status {
    constructor(serverContext, ignoreFolders, localPaths) {
        this._serverContext = serverContext;
        this._ignoreFolders = ignoreFolders;
        this._localPaths = localPaths;
    }
    GetArguments() {
        const builder = new argumentbuilder_1.ArgumentBuilder("status", this._serverContext)
            .AddSwitchWithValue("format", "xml", false)
            .AddSwitch("recursive");
        if (this._localPaths && this._localPaths.length > 0) {
            for (let i = 0; i < this._localPaths.length; i++) {
                builder.Add(this._localPaths[i]);
            }
        }
        return builder;
    }
    GetOptions() {
        return {};
    }
    /**
     * Parses the output of the status command when formatted as xml.
     * SAMPLE
     * <?xml version="1.0" encoding="utf-8"?>
     * <status>
     * <pending-changes>
     * <pending-change server-item="$/tfsTest_03/Folder333/DemandEquals_renamed.java" version="217" owner="NORTHAMERICA\jpricket" date="2017-02-08T11:12:06.766-0500" lock="none" change-type="rename" workspace="Folder1_00" source-item="$/tfsTest_03/Folder333/DemandEquals.java" computer="JPRICKET-DEV2" local-item="D:\tmp\tfsTest03_44\Folder333\DemandEquals_renamed.java" file-type="windows-1252"/>
     * </pending-changes>
     * <candidate-pending-changes>
     * <pending-change server-item="$/tfsTest_01/test.txt" version="0" owner="jason" date="2016-07-13T12:36:51.060-0400" lock="none" change-type="add" workspace="MyNewWorkspace2" computer="JPRICKET-DEV2" local-item="D:\tmp\test\test.txt"/>
     * </candidate-pending-changes>
     * </status>
     */
    ParseOutput(executionResult) {
        return __awaiter(this, void 0, void 0, function* () {
            // Throw if any errors are found in stderr or if exitcode is not 0
            commandhelper_1.CommandHelper.ProcessErrors(executionResult);
            const changes = [];
            const xml = commandhelper_1.CommandHelper.TrimToXml(executionResult.stdout);
            // Parse the xml using xml2js
            const json = yield commandhelper_1.CommandHelper.ParseXml(xml);
            if (json && json.status) {
                // get all the pending changes first
                const pending = json.status.pendingchanges[0].pendingchange;
                if (pending) {
                    for (let i = 0; i < pending.length; i++) {
                        this.add(changes, this.convert(pending[i].$, false), this._ignoreFolders);
                    }
                }
                // next, get all the candidate pending changes
                const candidate = json.status.candidatependingchanges[0].pendingchange;
                if (candidate) {
                    for (let i = 0; i < candidate.length; i++) {
                        this.add(changes, this.convert(candidate[i].$, true), this._ignoreFolders);
                    }
                }
            }
            return changes;
        });
    }
    GetExeArguments() {
        //return this.GetArguments();
        const builder = new argumentbuilder_1.ArgumentBuilder("status", this._serverContext)
            .AddSwitchWithValue("format", "detailed", false)
            .AddSwitch("recursive");
        if (this._localPaths && this._localPaths.length > 0) {
            for (let i = 0; i < this._localPaths.length; i++) {
                builder.Add(this._localPaths[i]);
            }
        }
        return builder;
    }
    GetExeOptions() {
        return this.GetOptions();
    }
    /*
    Parses the output of the status command when formatted as detailed
    SAMPLE
    $/jeyou/README.md;C19
    User       : Jeff Young (TFS)
    Date       : Wednesday, February 22, 2017 1:47:26 PM
    Lock       : none
    Change     : edit
    Workspace  : jeyou-dev00-tfexe-OnPrem
    Local item : [JEYOU-DEV00] C:\repos\TfExe.Tfvc.L2VSCodeExtension.RC.TFS\README.md
    File type  : utf-8

    -------------------------------------------------------------------------------------------------------------------------------------------------------------
    Detected Changes:
    -------------------------------------------------------------------------------------------------------------------------------------------------------------
    $/jeyou/therightstuff.txt
    User       : Jeff Young (TFS)
    Date       : Wednesday, February 22, 2017 11:48:34 AM
    Lock       : none
    Change     : add
    Workspace  : jeyou-dev00-tfexe-OnPrem
    Local item : [JEYOU-DEV00] C:\repos\TfExe.Tfvc.L2VSCodeExtension.RC.TFS\therightstuff.txt

    1 change(s), 0 detected change(s)
    */
    ParseExeOutput(executionResult) {
        return __awaiter(this, void 0, void 0, function* () {
            // Throw if any errors are found in stderr or if exitcode is not 0
            commandhelper_1.CommandHelper.ProcessErrors(executionResult);
            const changes = [];
            if (!executionResult.stdout) {
                return changes;
            }
            const lines = commandhelper_1.CommandHelper.SplitIntoLines(executionResult.stdout, true, false); //leave empty lines
            let detectedChanges = false;
            let curChange;
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.indexOf(" detected change(s)") > 0) {
                    //This tells us we're done
                    break;
                }
                if (!line || line.trim().length === 0) {
                    //If we have a curChange, we're finished with it
                    if (curChange !== undefined) {
                        changes.push(curChange);
                        curChange = undefined;
                    }
                    continue;
                }
                if (line.startsWith("--------") || line.toLowerCase().startsWith("detected changes: ")) {
                    //Starting Detected Changes...
                    detectedChanges = true;
                    continue;
                }
                if (line.startsWith("$/")) {
                    //$/jeyou/README.md;C19  //versioned
                    //$/jeyou/README.md  //isCandidate
                    const parts = line.split(";C");
                    curChange = { changeType: undefined, computer: undefined, date: undefined, localItem: undefined,
                        sourceItem: undefined, lock: undefined, owner: undefined,
                        serverItem: (parts && parts.length >= 1 ? parts[0] : undefined),
                        version: (parts && parts.length === 2 ? parts[1] : "0"),
                        workspace: undefined, isCandidate: detectedChanges };
                }
                else {
                    // Add the property to the current item
                    const colonPos = line.indexOf(":");
                    if (colonPos > 0) {
                        const propertyName = this.getPropertyName(line.slice(0, colonPos).trim().toLowerCase());
                        if (propertyName) {
                            let propertyValue = colonPos + 1 < line.length ? line.slice(colonPos + 1).trim() : "";
                            if (propertyName.toLowerCase() === "localitem") {
                                //Local item : [JEYOU-DEV00] C:\repos\TfExe.Tfvc.L2VSCodeExtension.RC.TFS\README.md
                                const parts = propertyValue.split("] ");
                                curChange["computer"] = parts[0].substr(1); //pop off the beginning [
                                propertyValue = parts[1];
                            }
                            curChange[propertyName] = propertyValue;
                        }
                    }
                }
            }
            return changes;
        });
    }
    getPropertyName(name) {
        switch (name) {
            case "local item": return "localItem";
            case "source item": return "sourceItem";
            case "user": return "owner"; //TODO: I don't think this is accurate
            case "date": return "date";
            case "lock": return "lock";
            case "change": return "changeType";
            case "workspace": return "workspace";
        }
        return undefined;
    }
    add(changes, newChange, ignoreFolders) {
        // Deleted files won't exist, but we still include them in the results
        if (ignoreFolders && fs.existsSync(newChange.localItem)) {
            // check to see if the local item is a file or folder
            const f = newChange.localItem;
            const stats = fs.lstatSync(f);
            if (stats.isDirectory()) {
                // It's a directory/folder and we don't want those
                return;
            }
        }
        changes.push(newChange);
    }
    convert(jsonChange, isCandidate) {
        // TODO check to make sure jsonChange is valid
        return {
            changeType: jsonChange.changetype,
            computer: jsonChange.computer,
            date: jsonChange.date,
            localItem: jsonChange.localitem,
            sourceItem: jsonChange.sourceitem,
            lock: jsonChange.lock,
            owner: jsonChange.owner,
            serverItem: jsonChange.serveritem,
            version: jsonChange.version,
            workspace: jsonChange.workspace,
            isCandidate: isCandidate
        };
    }
}
exports.Status = Status;

//# sourceMappingURL=status.js.map
