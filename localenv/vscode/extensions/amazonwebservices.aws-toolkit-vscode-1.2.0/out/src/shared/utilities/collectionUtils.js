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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./asyncIteratorShim");
function union(a, b) {
    const result = new Set();
    for (const item of a) {
        result.add(item);
    }
    for (const item of b) {
        result.add(item);
    }
    return result;
}
exports.union = union;
function intersection(sequence1, sequence2) {
    const set2 = new Set(sequence2);
    return new Set(filter(sequence1, item => set2.has(item)));
}
exports.intersection = intersection;
function difference(sequence1, sequence2) {
    const set2 = new Set(sequence2);
    return new Set(filter(sequence1, item => !set2.has(item)));
}
exports.difference = difference;
function complement(sequence1, sequence2) {
    const set1 = new Set(sequence1);
    return new Set(filter(sequence2, item => !set1.has(item)));
}
exports.complement = complement;
function toArrayAsync(items) {
    var items_1, items_1_1;
    var e_1, _a;
    return __awaiter(this, void 0, void 0, function* () {
        const result = [];
        try {
            for (items_1 = __asyncValues(items); items_1_1 = yield items_1.next(), !items_1_1.done;) {
                const item = items_1_1.value;
                result.push(item);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (items_1_1 && !items_1_1.done && (_a = items_1.return)) yield _a.call(items_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return result;
    });
}
exports.toArrayAsync = toArrayAsync;
function toMap(items, keySelector) {
    const result = new Map();
    for (const item of items) {
        const key = keySelector(item);
        if (!!key) {
            if (result.has(key)) {
                throw new Error(`Conflict: Multiple items have the key '${key}'`);
            }
            result.set(key, item);
        }
    }
    return result;
}
exports.toMap = toMap;
function toMapAsync(items, keySelector) {
    var items_2, items_2_1;
    var e_2, _a;
    return __awaiter(this, void 0, void 0, function* () {
        const result = new Map();
        try {
            for (items_2 = __asyncValues(items); items_2_1 = yield items_2.next(), !items_2_1.done;) {
                const item = items_2_1.value;
                const key = keySelector(item);
                if (!!key) {
                    if (result.has(key)) {
                        throw new Error(`Conflict: Multiple items have the key '${key}'`);
                    }
                    result.set(key, item);
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (items_2_1 && !items_2_1.done && (_a = items_2.return)) yield _a.call(items_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return result;
    });
}
exports.toMapAsync = toMapAsync;
function updateInPlace(target, keys, update, create) {
    const keySet = new Set(keys);
    for (const key of difference(target.keys(), keySet)) {
        target.delete(key);
    }
    for (const key of target.keys()) {
        update(key);
    }
    for (const key of complement(target.keys(), keySet)) {
        target.set(key, create(key));
    }
}
exports.updateInPlace = updateInPlace;
function* map(sequence, selector) {
    for (const item of sequence) {
        yield selector(item);
    }
}
exports.map = map;
function filter(sequence, condition) {
    const result = [];
    for (const item of sequence) {
        if (condition(item)) {
            result.push(item);
        }
    }
    return result;
}
exports.filter = filter;
function filterAsync(sequence, condition) {
    return __asyncGenerator(this, arguments, function* filterAsync_1() {
        for (const item of sequence) {
            if (yield __await(condition(item))) {
                yield yield __await(item);
            }
        }
    });
}
exports.filterAsync = filterAsync;
function first(sequence) {
    return __awaiter(this, void 0, void 0, function* () {
        const head = yield take(sequence, 1);
        return head.length > 0 ? head[0] : undefined;
    });
}
exports.first = first;
function take(sequence, count) {
    var sequence_1, sequence_1_1;
    var e_3, _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (count <= 0) {
            return [];
        }
        const result = [];
        try {
            for (sequence_1 = __asyncValues(sequence); sequence_1_1 = yield sequence_1.next(), !sequence_1_1.done;) {
                const item = sequence_1_1.value;
                result.push(item);
                if (result.length >= count) {
                    break;
                }
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (sequence_1_1 && !sequence_1_1.done && (_a = sequence_1.return)) yield _a.call(sequence_1);
            }
            finally { if (e_3) throw e_3.error; }
        }
        return result;
    });
}
exports.take = take;
//# sourceMappingURL=collectionUtils.js.map