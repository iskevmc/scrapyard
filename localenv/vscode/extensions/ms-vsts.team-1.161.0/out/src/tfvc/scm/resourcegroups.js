/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strings_1 = require("../../helpers/strings");
class ResourceGroup {
    constructor(_id, _label, _resources) {
        this._id = _id;
        this._label = _label;
        this._resources = _resources;
    }
    get id() { return this._id; }
    get label() { return this._label; }
    get resources() { return this._resources; }
}
exports.ResourceGroup = ResourceGroup;
class ConflictsGroup extends ResourceGroup {
    constructor(resources) {
        super(ConflictsGroup.ID, strings_1.Strings.ConflictsGroupName, resources);
    }
}
ConflictsGroup.ID = "conflicts";
exports.ConflictsGroup = ConflictsGroup;
class IncludedGroup extends ResourceGroup {
    constructor(resources) {
        super(IncludedGroup.ID, strings_1.Strings.IncludedGroupName, resources);
    }
}
IncludedGroup.ID = "included";
exports.IncludedGroup = IncludedGroup;
class ExcludedGroup extends ResourceGroup {
    constructor(resources) {
        super(ExcludedGroup.ID, strings_1.Strings.ExcludedGroupName, resources);
    }
}
ExcludedGroup.ID = "excluded";
exports.ExcludedGroup = ExcludedGroup;

//# sourceMappingURL=resourcegroups.js.map
