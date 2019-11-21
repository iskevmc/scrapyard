// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// ----------------------------------------------------------------------------
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var LanguageIdentifier;
(function (LanguageIdentifier) {
    LanguageIdentifier["Unknown"] = "unknown";
    LanguageIdentifier["Dotnetcore"] = "dotnetcore";
    LanguageIdentifier["JavaMaven"] = "java-maven";
    LanguageIdentifier["Nodejs"] = "nodejs";
})(LanguageIdentifier = exports.LanguageIdentifier || (exports.LanguageIdentifier = {}));
class RecognizerResult {
    constructor(identifier) {
        this.identifier = identifier;
    }
}
exports.RecognizerResult = RecognizerResult;
//# sourceMappingURL=RecognizerResult.js.map