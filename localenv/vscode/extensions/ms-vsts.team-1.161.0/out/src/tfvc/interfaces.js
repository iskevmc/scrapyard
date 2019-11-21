/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SyncType;
(function (SyncType) {
    SyncType[SyncType["Updated"] = 0] = "Updated";
    SyncType[SyncType["New"] = 1] = "New";
    SyncType[SyncType["Deleted"] = 2] = "Deleted";
    SyncType[SyncType["Conflict"] = 3] = "Conflict";
    SyncType[SyncType["Warning"] = 4] = "Warning";
    SyncType[SyncType["Error"] = 5] = "Error";
})(SyncType = exports.SyncType || (exports.SyncType = {}));
var AutoResolveType;
(function (AutoResolveType) {
    AutoResolveType[AutoResolveType["AutoMerge"] = 0] = "AutoMerge";
    AutoResolveType[AutoResolveType["TakeTheirs"] = 1] = "TakeTheirs";
    AutoResolveType[AutoResolveType["KeepYours"] = 2] = "KeepYours";
    AutoResolveType[AutoResolveType["OverwriteLocal"] = 3] = "OverwriteLocal";
    AutoResolveType[AutoResolveType["DeleteConflict"] = 4] = "DeleteConflict";
    AutoResolveType[AutoResolveType["KeepYoursRenameTheirs"] = 5] = "KeepYoursRenameTheirs";
})(AutoResolveType = exports.AutoResolveType || (exports.AutoResolveType = {}));

//# sourceMappingURL=interfaces.js.map
