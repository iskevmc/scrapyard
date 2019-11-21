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
const fse = require("fs-extra");
const request = require("request");
const logger_1 = require("./logger");
const resourceLocation_1 = require("./resourceLocation");
class DefaultResourceFetcher {
    // Attempts to retrieve a resource from the given locations in order, stopping on the first success.
    getResource(resourceLocations) {
        return __awaiter(this, void 0, void 0, function* () {
            const logger = logger_1.getLogger();
            if (resourceLocations.length === 0) {
                throw new Error('no locations provided to get resource from');
            }
            for (const resourceLocation of resourceLocations) {
                try {
                    let result;
                    if (resourceLocation instanceof resourceLocation_1.WebResourceLocation) {
                        result = yield this.getWebResource(resourceLocation);
                    }
                    else if (resourceLocation instanceof resourceLocation_1.FileResourceLocation) {
                        result = yield this.getFileResource(resourceLocation);
                    }
                    else {
                        throw new Error(`Unknown resource location type: ${typeof resourceLocation}`);
                    }
                    return Promise.resolve(result);
                }
                catch (err) {
                    // Log error, then try the next fallback location if there is one.
                    const error = err;
                    logger.error(`Error getting resource from ${resourceLocation.getLocationUri()} : `, error);
                }
            }
            return Promise.reject(new Error('Resource could not be found'));
        });
    }
    // Http based file retriever
    getWebResource(resourceLocation) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                // TODO: consider inject cache lookup here, or put that in a separate ResourceFetcherBase class
                request(resourceLocation.getLocationUri(), {}, (err, res, body) => {
                    if (!!err) {
                        reject(err);
                    }
                    else {
                        resolve(body);
                    }
                });
            });
        });
    }
    // Local file retriever
    getFileResource(resourceLocation) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                try {
                    const content = fse.readFileSync(resourceLocation.getLocationUri()).toString();
                    resolve(content);
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }
}
exports.DefaultResourceFetcher = DefaultResourceFetcher;
//# sourceMappingURL=defaultResourceFetcher.js.map