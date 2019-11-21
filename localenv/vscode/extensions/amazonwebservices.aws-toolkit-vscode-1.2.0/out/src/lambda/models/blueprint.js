"use strict";
/*!
 * Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
var BlueprintOrigin;
(function (BlueprintOrigin) {
    BlueprintOrigin[BlueprintOrigin["vsToolkit"] = 0] = "vsToolkit";
    BlueprintOrigin[BlueprintOrigin["other"] = 1] = "other"; // TBD
})(BlueprintOrigin = exports.BlueprintOrigin || (exports.BlueprintOrigin = {}));
// Enscapsulates a Lambda project blueprint, either from the Visual Studio
// blueprints collection or other sources
class Blueprint {
    constructor(name, description, filename, origin) {
        this.name = name;
        this.description = description;
        this.filename = filename;
        this.origin = origin;
    }
    isForLanguage(language) {
        if (this.origin === BlueprintOrigin.vsToolkit) {
            if (this.hiddenTags) {
                return this.hiddenTags.some(hiddenTag => hiddenTag === language);
            }
            return false;
        }
        throw new Error('Other blueprint stores are not yet implemented');
    }
}
exports.Blueprint = Blueprint;
//# sourceMappingURL=blueprint.js.map