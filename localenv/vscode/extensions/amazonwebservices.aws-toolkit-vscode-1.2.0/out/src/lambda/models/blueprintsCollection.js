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
const xml2js = require("xml2js");
const constants_1 = require("../../shared/constants");
const resourceLocation_1 = require("../../shared/resourceLocation");
const constants_2 = require("../constants");
const blueprint_1 = require("./blueprint");
// Represents a collection of blueprints, potentially from multiple sources
class BlueprintsCollection {
    constructor(context, resourceFetcher) {
        this.availableBlueprints = [];
        this._context = context;
        this._resourceFetcher = resourceFetcher;
    }
    loadAllBlueprints() {
        return __awaiter(this, void 0, void 0, function* () {
            this.availableBlueprints = [];
            yield this.loadVisualStudioBlueprints();
            // TODO: load additional blueprints from SAR?
        });
    }
    // Evaluates the various tags to determine what languages we have blueprints
    // available for. This does rely on us normalizing all blueprint data sources
    // at load time.
    filterBlueprintLanguages() {
        const languages = [];
        // hack for now! Unfortunately language is encoded in amongst other tag
        // values for VS
        languages.push('C#');
        languages.push('F#');
        return languages;
    }
    filterBlueprintsForLanguage(language) {
        const filteredBlueprints = [];
        this.availableBlueprints.forEach((b) => {
            if (b.isForLanguage(language)) {
                filteredBlueprints.push(b);
            }
        });
        return filteredBlueprints;
    }
    loadVisualStudioBlueprints() {
        return __awaiter(this, void 0, void 0, function* () {
            const manifestUrl = constants_1.hostedFilesBaseUrl + constants_2.blueprintsManifestPath;
            const results = yield this.listBlueprintsVSToolkitFromManifest(manifestUrl);
            results.forEach((b) => this.availableBlueprints.push(b));
        });
    }
    listBlueprintsVSToolkitFromManifest(manifestUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const resourcePath = path.join(this._context.extensionPath, 'resources', 'vs-lambda-blueprint-manifest.xml');
            const manifest = yield this._resourceFetcher.getResource([
                new resourceLocation_1.WebResourceLocation(manifestUrl),
                new resourceLocation_1.FileResourceLocation(resourcePath)
            ]);
            return new Promise((resolve, reject) => {
                xml2js.parseString(manifest, { explicitArray: false }, (err, result) => {
                    if (err) {
                        // TODO: fall back to resource version before giving up
                        reject(err);
                    }
                    else {
                        const blueprints = result.BlueprintManifest.Blueprints.Blueprint.map(b => {
                            const blueprint = new blueprint_1.Blueprint(b.Name, b.Description, b.File, blueprint_1.BlueprintOrigin.vsToolkit);
                            // post optional data
                            if (b.SortOrder) {
                                blueprint.sortOrder = b.SortOrder;
                            }
                            // both tag collections could have deserialized as one string or an array
                            if (b.Tags && b.Tags.Tag) {
                                blueprint.tags = BlueprintsCollection.stringOrArrayToStringArray(b.Tags.Tag);
                            }
                            if (b.HiddenTags && b.HiddenTags.HiddenTag) {
                                blueprint.hiddenTags = BlueprintsCollection.stringOrArrayToStringArray(b.HiddenTags.HiddenTag);
                            }
                            return blueprint;
                        });
                        resolve(blueprints);
                    }
                });
            });
        });
    }
    static stringOrArrayToStringArray(input) {
        return Array.isArray(input) ? [...input] : [input];
    }
}
exports.BlueprintsCollection = BlueprintsCollection;
//# sourceMappingURL=blueprintsCollection.js.map