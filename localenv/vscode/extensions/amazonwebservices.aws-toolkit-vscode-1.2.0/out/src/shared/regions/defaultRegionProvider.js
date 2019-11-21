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
const path = require("path");
const constants_1 = require("../constants");
const logger_1 = require("../logger");
const resourceLocation_1 = require("../resourceLocation");
const regionInfo_1 = require("./regionInfo");
class DefaultRegionProvider {
    constructor(context, resourceFetcher) {
        this._areRegionsLoaded = false;
        this._loadedRegions = [];
        this._context = context;
        this._resourceFetcher = resourceFetcher;
    }
    // Returns an array of Regions, and caches them in memory.
    getRegionData() {
        return __awaiter(this, void 0, void 0, function* () {
            const logger = logger_1.getLogger();
            if (this._areRegionsLoaded) {
                return this._loadedRegions;
            }
            let availableRegions = [];
            try {
                logger.info('> Downloading latest toolkits endpoint data');
                const resourcePath = path.join(this._context.extensionPath, 'resources', 'endpoints.json');
                const endpointsSource = yield this._resourceFetcher.getResource([
                    new resourceLocation_1.WebResourceLocation(constants_1.endpointsFileUrl),
                    new resourceLocation_1.FileResourceLocation(resourcePath)
                ]);
                const allEndpoints = JSON.parse(endpointsSource);
                availableRegions = getRegionsFromEndpoints(allEndpoints);
                this._areRegionsLoaded = true;
                this._loadedRegions = availableRegions;
            }
            catch (err) {
                this._areRegionsLoaded = false;
                logger.error('...error downloading endpoints: ', err);
                // TODO: now what, oneline + local failed...?
                availableRegions = [];
                this._loadedRegions = [];
            }
            return availableRegions;
        });
    }
}
exports.DefaultRegionProvider = DefaultRegionProvider;
function getRegionsFromPartition(partition) {
    return Object.keys(partition.regions).map(regionKey => new regionInfo_1.RegionInfo(regionKey, `${partition.regions[regionKey].description}`));
}
exports.getRegionsFromPartition = getRegionsFromPartition;
function getRegionsFromEndpoints(endpoints) {
    return (endpoints.partitions
        // TODO : Support other Partition regions : https://github.com/aws/aws-toolkit-vscode/issues/188
        .filter(partition => partition.partition && partition.partition === 'aws')
        .reduce((accumulator, partition) => {
        accumulator.push(...getRegionsFromPartition(partition));
        return accumulator;
    }, []));
}
exports.getRegionsFromEndpoints = getRegionsFromEndpoints;
//# sourceMappingURL=defaultRegionProvider.js.map