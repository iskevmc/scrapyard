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
/**
 * This command  checks in files into TFVC
 * <p/>
 * checkin [/all] [/author:<value>] [/comment:<value>|@valuefile] [/notes:"note"="value"[;"note2"="value2"[;...]]|@notefile]
 * [/override:<value>|@valuefile] [/recursive] [/validate] [/bypass] [/force] [/noautoresolve] [/associate:<workItemID>[,<workItemID>...]]
 * [/resolve:<workItemID>[,<workItemID>...]] [/saved] [<itemSpec>...]
 */
class Checkin {
    constructor(serverContext, files, comment, workItemIds) {
        commandhelper_1.CommandHelper.RequireStringArrayArgument(files, "files");
        this._serverContext = serverContext;
        this._files = files;
        this._comment = comment;
        this._workItemIds = workItemIds;
    }
    GetArguments() {
        const builder = new argumentbuilder_1.ArgumentBuilder("checkin", this._serverContext)
            .AddAll(this._files);
        if (this._comment) {
            builder.AddSwitchWithValue("comment", this.getComment(), false);
        }
        if (this._workItemIds && this._workItemIds.length > 0) {
            builder.AddSwitchWithValue("associate", this.getAssociatedWorkItems(), false);
        }
        return builder;
    }
    GetOptions() {
        return {};
    }
    getComment() {
        // replace newlines with spaces
        return this._comment.replace(/\r\n/g, " ").replace(/\n/g, " ");
    }
    getAssociatedWorkItems() {
        return this._workItemIds.join(",");
    }
    /**
     * Returns the files that were checked in
     * <p/>
     * Output example for success:
     * /Users/leantk/tfvc-tfs/tfsTest_01/addFold:
     * Checking in edit: testHere.txt
     * <p/>
     * /Users/leantk/tfvc-tfs/tfsTest_01:
     * Checking in edit: test3.txt
     * Checking in edit: TestAdd.txt
     * <p/>
     * Changeset #20 checked in.
     * <p/>
     * Output example for failure:
     * <p/>
     * /Users/leantk/tfvc-tfs/tfsTest_01:
     * Checking in edit: test3.txt
     * Checking in edit: TestAdd.txt
     * Unable to perform operation on $/tfsTest_01/TestAdd.txt. The item $/tfsTest_01/TestAdd.txt is locked in workspace new;Leah Antkiewicz.
     * No files checked in.
     * <p/>
     * No files checked in.
     */
    ParseOutput(executionResult) {
        return __awaiter(this, void 0, void 0, function* () {
            if (executionResult.exitCode === 100) {
                commandhelper_1.CommandHelper.ProcessErrors(executionResult);
            }
            else {
                return commandhelper_1.CommandHelper.GetChangesetNumber(executionResult.stdout);
            }
        });
    }
    GetExeArguments() {
        const builder = new argumentbuilder_1.ArgumentBuilder("checkin", this._serverContext, true /* skipCollectionOption */)
            .AddAll(this._files);
        if (this._comment) {
            builder.AddSwitchWithValue("comment", this.getComment(), false);
        }
        // TF.EXE doesn't support associating work items with checkin
        //builder.AddSwitchWithValue("associate", this.getAssociatedWorkItems(), false);
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
exports.Checkin = Checkin;

//# sourceMappingURL=checkin.js.map
