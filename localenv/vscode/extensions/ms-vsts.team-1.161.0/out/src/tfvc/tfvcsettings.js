/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
const settings_1 = require("../helpers/settings");
//TODO: Consider making this class 'static' so we can get values wherever we need them. Be aware
//that if we take a transitive reference to VSCode, the unit tests for the commands we use this
//class from will no longer run.
class TfvcSettings extends settings_1.BaseSettings {
    constructor() {
        super();
        this._location = this.readSetting(SettingNames.Location, undefined);
        // Support replacing leading ~/ on macOS and linux
        if (this._location && this._location.startsWith("~/") &&
            (os.platform() === "darwin" || os.platform() === "linux")) {
            this._location = this._location.replace(/^~(\/)/, `${os.homedir()}$1`);
        }
        if (this._location) {
            this._location = this._location.trim();
        }
        this._proxy = this.readSetting(SettingNames.Proxy, undefined);
        this._restrictWorkspace = this.readSetting(SettingNames.RestrictWorkspace, false);
    }
    get Location() {
        return this._location;
    }
    get Proxy() {
        return this._proxy;
    }
    get RestrictWorkspace() {
        return this._restrictWorkspace;
    }
}
exports.TfvcSettings = TfvcSettings;
class SettingNames {
    static get Location() { return "tfvc.location"; }
    static get Proxy() { return "tfvc.proxy"; }
    static get RestrictWorkspace() { return "tfvc.restrictWorkspace"; }
}

//# sourceMappingURL=tfvcsettings.js.map
