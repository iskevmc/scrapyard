/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function GetStatuses(statusText) {
    const result = [];
    if (!statusText) {
        return result;
    }
    const statusStrings = statusText.split(",");
    for (let i = 0; i < statusStrings.length; i++) {
        switch (statusStrings[i].trim().toLowerCase()) {
            case "add":
                result.push(Status.ADD);
                break;
            case "branch":
                result.push(Status.BRANCH);
                break;
            case "delete":
                result.push(Status.DELETE);
                break;
            case "edit":
                result.push(Status.EDIT);
                break;
            case "lock":
                result.push(Status.LOCK);
                break;
            case "merge":
                result.push(Status.MERGE);
                break;
            case "rename":
                result.push(Status.RENAME);
                break;
            case "source rename":
                result.push(Status.RENAME);
                break;
            case "undelete":
                result.push(Status.UNDELETE);
                break;
            default:
                result.push(Status.UNKNOWN);
                break;
        }
    }
    return result;
}
exports.GetStatuses = GetStatuses;
var Status;
(function (Status) {
    Status[Status["ADD"] = 0] = "ADD";
    Status[Status["RENAME"] = 1] = "RENAME";
    Status[Status["EDIT"] = 2] = "EDIT";
    Status[Status["DELETE"] = 3] = "DELETE";
    Status[Status["UNDELETE"] = 4] = "UNDELETE";
    Status[Status["LOCK"] = 5] = "LOCK";
    Status[Status["BRANCH"] = 6] = "BRANCH";
    Status[Status["MERGE"] = 7] = "MERGE";
    Status[Status["CONFLICT"] = 8] = "CONFLICT";
    Status[Status["UNKNOWN"] = 9] = "UNKNOWN";
})(Status = exports.Status || (exports.Status = {}));
var ConflictType;
(function (ConflictType) {
    ConflictType[ConflictType["CONTENT"] = 0] = "CONTENT";
    ConflictType[ConflictType["RENAME"] = 1] = "RENAME";
    ConflictType[ConflictType["DELETE"] = 2] = "DELETE";
    ConflictType[ConflictType["DELETE_TARGET"] = 3] = "DELETE_TARGET";
    ConflictType[ConflictType["NAME_AND_CONTENT"] = 4] = "NAME_AND_CONTENT";
    ConflictType[ConflictType["MERGE"] = 5] = "MERGE";
    ConflictType[ConflictType["RESOLVED"] = 6] = "RESOLVED";
})(ConflictType = exports.ConflictType || (exports.ConflictType = {}));

//# sourceMappingURL=status.js.map
