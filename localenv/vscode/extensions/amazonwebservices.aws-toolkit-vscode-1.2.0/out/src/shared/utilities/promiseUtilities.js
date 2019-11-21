"use strict";
/*!
 * Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const AsyncLock = require("async-lock");
const lock = new AsyncLock();
/**
 * Allows callers to use the same promise instead of starting a new one if it is currently running
 */
class PromiseSharer {
    /**
     * Allows callers to retrieve the same promise back if requested multiple times over the duration of a promise
     * @param promiseName used to assess there is a promise to share
     * @param promiseGenerator actual promise to run. Caller is responsible for providing the same name/generator pair
     */
    static getExistingPromiseOrCreate(promiseName, promiseGenerator) {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO : Come up with a way to prevent using promiseName with an unrelated promise
            let promise;
            yield lock.acquire(PromiseSharer.LOCK_PROMISE_REUSE, () => __awaiter(this, void 0, void 0, function* () {
                if (!PromiseSharer.PROMISE_CACHE[promiseName]) {
                    PromiseSharer.PROMISE_CACHE[promiseName] = PromiseSharer.createPromise(promiseName, promiseGenerator);
                }
                promise = PromiseSharer.PROMISE_CACHE[promiseName];
            }));
            return promise;
        });
    }
    static createPromise(promiseName, promiseGenerator) {
        return __awaiter(this, void 0, void 0, function* () {
            yield promiseGenerator();
            yield lock.acquire(PromiseSharer.LOCK_PROMISE_REUSE, () => __awaiter(this, void 0, void 0, function* () {
                PromiseSharer.PROMISE_CACHE[promiseName] = undefined;
            }));
        });
    }
}
PromiseSharer.LOCK_PROMISE_REUSE = 'lock.promise.reuse';
PromiseSharer.PROMISE_CACHE = {};
exports.PromiseSharer = PromiseSharer;
//# sourceMappingURL=promiseUtilities.js.map