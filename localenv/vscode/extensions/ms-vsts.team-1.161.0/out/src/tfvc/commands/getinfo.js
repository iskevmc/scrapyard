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
const tfvcerror_1 = require("../tfvcerror");
const argumentbuilder_1 = require("./argumentbuilder");
const commandhelper_1 = require("./commandhelper");
/**
 * This command calls Info which returns local and server information about an item in the workspace.
 * <p/>
 * info [/recursive] [/version:<value>] <itemSpec>...
 */
class GetInfo {
    constructor(serverContext, itemPaths) {
        commandhelper_1.CommandHelper.RequireStringArrayArgument(itemPaths, "itemPaths");
        this._serverContext = serverContext;
        this._itemPaths = itemPaths;
    }
    GetArguments() {
        return new argumentbuilder_1.ArgumentBuilder("info", this._serverContext)
            .AddAll(this._itemPaths);
    }
    GetOptions() {
        return {};
    }
    /**
     * Example of output (Exactly the same for tf.cmd and tf.exe)
     * Local information:
     * Local path:  D:\tmp\TFVC_1\build.xml
     * Server path: $/TFVC_1/build.xml
     * Changeset:   18
     * Change:      none
     * Type:        file
     * Server information:
     * Server path:   $/TFVC_1/build.xml
     * Changeset:     18
     * Deletion ID:   0
     * Lock:          none
     * Lock owner:
     * Last modified: Nov 18, 2016 11:10:20 AM
     * Type:          file
     * File type:     windows-1252
     * Size:          1385
     */
    ParseOutput(executionResult) {
        return __awaiter(this, void 0, void 0, function* () {
            // Throw if any errors are found in stderr or if exitcode is not 0
            commandhelper_1.CommandHelper.ProcessErrors(executionResult);
            const itemInfos = [];
            if (!executionResult.stdout) {
                return itemInfos;
            }
            const lines = commandhelper_1.CommandHelper.SplitIntoLines(executionResult.stdout, true, true);
            let curMode = ""; // "" is local mode, "server" is server mode
            let curItem;
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                // Check the beginning of a new item
                // "no items match" means that the item requested was not found. In this case
                // we will return an empty info object in that item's place.
                if (line.toLowerCase().startsWith("no items match ") ||
                    line.toLowerCase().startsWith("local information:")) {
                    // We are starting a new Info section for the next item.
                    // So, finish off any in progress item and start a new one.
                    curMode = "";
                    if (curItem !== undefined) {
                        itemInfos.push(curItem);
                    }
                    curItem = { serverItem: undefined, localItem: undefined };
                }
                else if (line.toLowerCase().startsWith("server information:")) {
                    // We finished with the local properties and are starting the server properties
                    curMode = "server ";
                }
                else {
                    // Add the property to the current item
                    const colonPos = line.indexOf(":");
                    if (colonPos > 0) {
                        const propertyName = this.getPropertyName(curMode + line.slice(0, colonPos).trim().toLowerCase());
                        if (propertyName) {
                            const propertyValue = colonPos + 1 < line.length ? line.slice(colonPos + 1).trim() : "";
                            curItem[propertyName] = propertyValue;
                        }
                    }
                }
            }
            if (curItem !== undefined) {
                itemInfos.push(curItem);
            }
            // If all of the info objects are "empty" let's report an error
            if (itemInfos.length > 0 &&
                itemInfos.length === itemInfos.filter((info) => info.localItem === undefined).length) {
                throw new tfvcerror_1.TfvcError({
                    message: strings_1.Strings.NoMatchesFound,
                    tfvcErrorCode: tfvcerror_1.TfvcErrorCodes.NoItemsMatch,
                    exitCode: executionResult.exitCode
                });
            }
            return itemInfos;
        });
    }
    GetExeArguments() {
        return this.GetArguments();
    }
    GetExeOptions() {
        return this.GetOptions();
    }
    ParseExeOutput(executionResult) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.ParseOutput(executionResult);
        });
    }
    getPropertyName(name) {
        switch (name) {
            case "server path": return "serverItem";
            case "local path": return "localItem";
            case "server changeset": return "serverVersion";
            case "changeset": return "localVersion";
            case "change": return "change";
            case "type": return "type";
            case "server lock": return "lock";
            case "server lock owner": return "lockOwner";
            case "server deletion id": return "deletionId";
            case "server last modified": return "lastModified";
            case "server file type": return "fileType";
            case "server size": return "fileSize";
        }
        return undefined;
    }
}
exports.GetInfo = GetInfo;

//# sourceMappingURL=getinfo.js.map
