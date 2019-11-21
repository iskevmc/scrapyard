// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// ----------------------------------------------------------------------------
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
class ThenableUtility {
    // Converts a Thenable to a native Promise.
    static ToPromise(thenable) {
        return new Promise((resolve, reject) => {
            const onFulfilled = (value) => {
                resolve(value);
            };
            const onRejected = (reason) => {
                reject(reason);
            };
            thenable.then(onFulfilled, onRejected);
        });
    }
}
exports.ThenableUtility = ThenableUtility;
//# sourceMappingURL=ThenableUtility.js.map