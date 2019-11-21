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
const interfaces_1 = require("../interfaces");
const status_1 = require("../scm/status");
const argumentbuilder_1 = require("./argumentbuilder");
const commandhelper_1 = require("./commandhelper");
/**
 * This command resolves conflicts based on given auto resolve type
 *
 * tf resolve [itemspec]
 * [/auto:(AutoMerge|TakeTheirs|KeepYours|OverwriteLocal|DeleteConflict|KeepYoursRenameTheirs)]
 * [/preview] [(/overridetype:overridetype | /converttotype:converttype] [/recursive] [/newname:path] [/noprompt] [/login:username, [password]]
 */
class ResolveConflicts {
    constructor(serverContext, itemPaths, autoResolveType) {
        this._serverContext = serverContext;
        commandhelper_1.CommandHelper.RequireStringArrayArgument(itemPaths, "itemPaths");
        commandhelper_1.CommandHelper.RequireArgument(autoResolveType, "autoResolveType");
        this._itemPaths = itemPaths;
        this._autoResolveType = autoResolveType;
    }
    GetArguments() {
        const builder = new argumentbuilder_1.ArgumentBuilder("resolve", this._serverContext)
            .AddAll(this._itemPaths)
            .AddSwitchWithValue("auto", interfaces_1.AutoResolveType[this._autoResolveType], false);
        return builder;
    }
    GetOptions() {
        return {};
    }
    /**
     * Outputs the resolved conflicts in the following format:
     *
     * Resolved /Users/leantk/tfvc-tfs/tfsTest_01/TestAdd.txt as KeepYours
     * Resolved /Users/leantk/tfvc-tfs/tfsTest_01/addFold/testHere2 as KeepYours
     */
    ParseOutput(executionResult) {
        return __awaiter(this, void 0, void 0, function* () {
            commandhelper_1.CommandHelper.ProcessErrors(executionResult);
            const conflicts = [];
            const lines = commandhelper_1.CommandHelper.SplitIntoLines(executionResult.stdout, true, true);
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const startIndex = line.indexOf("Resolved ");
                const endIndex = line.lastIndexOf(" as ");
                if (startIndex >= 0 && endIndex > startIndex) {
                    conflicts.push({
                        localPath: line.slice(startIndex + "Resolved ".length, endIndex),
                        type: status_1.ConflictType.RESOLVED,
                        message: line
                    });
                }
            }
            return conflicts;
        });
    }
    GetExeArguments() {
        const builder = new argumentbuilder_1.ArgumentBuilder("resolve", this._serverContext, true /* skipCollectionOption */)
            .AddAll(this._itemPaths)
            .AddSwitchWithValue("auto", interfaces_1.AutoResolveType[this._autoResolveType], false);
        return builder;
    }
    GetExeOptions() {
        return this.GetOptions();
    }
    ParseExeOutput(executionResult) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.ParseOutput(executionResult);
        });
    }
}
exports.ResolveConflicts = ResolveConflicts;

//# sourceMappingURL=resolveconflicts.js.map
