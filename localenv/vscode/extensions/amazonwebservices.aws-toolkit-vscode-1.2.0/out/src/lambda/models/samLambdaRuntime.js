"use strict";
/*!
 * Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
const immutable = require("immutable");
exports.samLambdaRuntimes = immutable.Set([
    'python3.7',
    'python3.6',
    'python2.7',
    'nodejs8.10',
    'nodejs10.x',
    'dotnetcore2.1'
]);
// TODO: Make this return an array of DependencyManagers when we add runtimes with multiple dependency managers
function getDependencyManager(runtime) {
    switch (runtime) {
        case 'nodejs10.x':
        case 'nodejs8.10':
            return 'npm';
        case 'python2.7':
        case 'python3.6':
        case 'python3.7':
            return 'pip';
        case 'dotnetcore2.1':
            return 'cli-package';
        default:
            throw new Error(`Runtime ${runtime} does not have an associated DependencyManager`);
    }
}
exports.getDependencyManager = getDependencyManager;
var SamLambdaRuntimeFamily;
(function (SamLambdaRuntimeFamily) {
    SamLambdaRuntimeFamily[SamLambdaRuntimeFamily["Python"] = 0] = "Python";
    SamLambdaRuntimeFamily[SamLambdaRuntimeFamily["NodeJS"] = 1] = "NodeJS";
    SamLambdaRuntimeFamily[SamLambdaRuntimeFamily["DotNetCore"] = 2] = "DotNetCore";
})(SamLambdaRuntimeFamily = exports.SamLambdaRuntimeFamily || (exports.SamLambdaRuntimeFamily = {}));
function getFamily(runtime) {
    switch (runtime) {
        case 'python3.7':
        case 'python3.6':
        case 'python2.7':
        case 'python':
            return SamLambdaRuntimeFamily.Python;
        case 'nodejs8.10':
        case 'nodejs10.x':
        case 'nodejs':
            return SamLambdaRuntimeFamily.NodeJS;
        case 'dotnetcore2.1':
        case 'dotnetcore':
        case 'dotnet':
            return SamLambdaRuntimeFamily.DotNetCore;
        default:
            throw new Error(`Unrecognized runtime: '${runtime}'`);
    }
}
exports.getFamily = getFamily;
// This allows us to do things like "sort" nodejs10.x after nodejs8.10
// Map Values are used for comparisons, not for display
const runtimeCompareText = new Map([
    ['nodejs8.10', 'nodejs08.10']
]);
function getSortableCompareText(runtime) {
    return runtimeCompareText.get(runtime) || runtime.toString();
}
function compareSamLambdaRuntime(a, b) {
    return getSortableCompareText(a).localeCompare(getSortableCompareText(b));
}
exports.compareSamLambdaRuntime = compareSamLambdaRuntime;
//# sourceMappingURL=samLambdaRuntime.js.map