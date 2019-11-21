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
const sleep = require("sleep-promise");
const vscode = require("vscode");
function loadSymbols({ uri, context, maxRetries = 10, retryDelayMillis = 200 }) {
    return __awaiter(this, void 0, void 0, function* () {
        const symbols = yield context.executeCommand('vscode.executeDocumentSymbolProvider', uri);
        // checking if symbols exists as this can fail if the VS Code JSON symbol provider is not yet initialized
        if (symbols) {
            // file has symbols if JSON with at least one valid top-level key/value pair
            return symbols;
        }
        if (maxRetries <= 0) {
            return undefined;
        }
        // waiting before retry to wait for JSON parser
        yield sleep(retryDelayMillis);
        return yield loadSymbols({
            uri,
            context,
            maxRetries: maxRetries - 1,
            retryDelayMillis
        });
    });
}
exports.loadSymbols = loadSymbols;
function getChildrenRange(symbol) {
    return __awaiter(this, void 0, void 0, function* () {
        let start;
        let end;
        for (const range of symbol.children.map(c => c.range)) {
            if (!start || range.start.isBefore(start)) {
                start = range.start;
            }
            if (!end || range.end.isAfter(end)) {
                end = range.end;
            }
        }
        if (!start || !end) {
            // If symbol has no children, default to its entire range.
            return symbol.range;
        }
        return new vscode.Range(start, end);
    });
}
exports.getChildrenRange = getChildrenRange;
//# sourceMappingURL=symbolUtilities.js.map