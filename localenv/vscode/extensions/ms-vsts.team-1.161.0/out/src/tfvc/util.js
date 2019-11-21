/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function log(...args) {
    console.log.apply(console, ["tfvc:", ...args]);
}
exports.log = log;
function dispose(disposables) {
    disposables.forEach((d) => d.dispose());
    return [];
}
exports.dispose = dispose;
function toDisposable(dispose) {
    return { dispose };
}
exports.toDisposable = toDisposable;
function combinedDisposable(disposables) {
    return toDisposable(() => dispose(disposables));
}
exports.combinedDisposable = combinedDisposable;
function mapEvent(event, map) {
    return (listener, thisArgs = null, disposables) => event((i) => listener.call(thisArgs, map(i)), null, disposables);
}
exports.mapEvent = mapEvent;
function filterEvent(event, filter) {
    return (listener, thisArgs = null, disposables) => event((e) => filter(e) && listener.call(thisArgs, e), null, disposables);
}
exports.filterEvent = filterEvent;
function anyEvent(...events) {
    return (listener, thisArgs = null, disposables) => combinedDisposable(events.map((event) => event((i) => listener.call(thisArgs, i), disposables)));
}
exports.anyEvent = anyEvent;
function done(promise) {
    return promise.then(() => void 0, () => void 0);
}
exports.done = done;
function once(event) {
    return (listener, thisArgs = null, disposables) => {
        const result = event((e) => {
            result.dispose();
            return listener.call(thisArgs, e);
        }, null, disposables);
        return result;
    };
}
exports.once = once;
function eventToPromise(event) {
    return new Promise((c) => once(event)(c));
}
exports.eventToPromise = eventToPromise;

//# sourceMappingURL=util.js.map
