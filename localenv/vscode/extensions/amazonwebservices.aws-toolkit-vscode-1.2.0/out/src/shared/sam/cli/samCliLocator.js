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
const filesystemUtilities = require("../../filesystemUtilities");
class DefaultSamCliLocationProvider {
    getLocation() {
        return __awaiter(this, void 0, void 0, function* () {
            return DefaultSamCliLocationProvider.getSamCliLocator().getLocation();
        });
    }
    static getSamCliLocator() {
        if (!DefaultSamCliLocationProvider.SAM_CLI_LOCATOR) {
            if (process.platform === 'win32') {
                DefaultSamCliLocationProvider.SAM_CLI_LOCATOR = new WindowsSamCliLocator();
            }
            else {
                DefaultSamCliLocationProvider.SAM_CLI_LOCATOR = new UnixSamCliLocator();
            }
        }
        return DefaultSamCliLocationProvider.SAM_CLI_LOCATOR;
    }
}
exports.DefaultSamCliLocationProvider = DefaultSamCliLocationProvider;
class BaseSamCliLocator {
    constructor() {
        this.verifyOs();
    }
    getLocation() {
        return __awaiter(this, void 0, void 0, function* () {
            let location = yield this.findFileInFolders(this.getExecutableFilenames(), this.getExecutableFolders());
            if (!location) {
                location = yield this.getSystemPathLocation();
            }
            return location;
        });
    }
    findFileInFolders(files, folders) {
        return __awaiter(this, void 0, void 0, function* () {
            const fullPaths = files
                .map(file => folders.filter(folder => !!folder).map(folder => path.join(folder, file)))
                .reduce((accumulator, paths) => {
                accumulator.push(...paths);
                return accumulator;
            });
            for (const fullPath of fullPaths) {
                if (yield filesystemUtilities.fileExists(fullPath)) {
                    return fullPath;
                }
            }
            return undefined;
        });
    }
    getSystemPathLocation() {
        return __awaiter(this, void 0, void 0, function* () {
            const envVars = process.env;
            if (!!envVars.PATH) {
                const systemPaths = envVars.PATH.split(path.delimiter).filter(folder => !!folder);
                return yield this.findFileInFolders(this.getExecutableFilenames(), systemPaths);
            }
            return undefined;
        });
    }
}
class WindowsSamCliLocator extends BaseSamCliLocator {
    constructor() {
        super();
    }
    verifyOs() {
        if (process.platform !== 'win32') {
            throw new Error('Wrong platform');
        }
    }
    getExecutableFilenames() {
        return WindowsSamCliLocator.EXECUTABLE_FILENAMES;
    }
    getExecutableFolders() {
        if (!WindowsSamCliLocator.LOCATION_PATHS) {
            WindowsSamCliLocator.LOCATION_PATHS = [];
            const envVars = process.env;
            const programFiles = envVars.PROGRAMFILES;
            if (!!programFiles) {
                WindowsSamCliLocator.LOCATION_PATHS.push(String.raw `${programFiles}\Amazon\AWSSAMCLI\bin`);
            }
            const programFilesX86 = envVars['PROGRAMFILES(X86)'];
            if (!!programFilesX86) {
                WindowsSamCliLocator.LOCATION_PATHS.push(String.raw `${programFilesX86}\Amazon\AWSSAMCLI\bin`);
            }
        }
        return WindowsSamCliLocator.LOCATION_PATHS;
    }
}
WindowsSamCliLocator.EXECUTABLE_FILENAMES = ['sam.cmd', 'sam.exe'];
class UnixSamCliLocator extends BaseSamCliLocator {
    constructor() {
        super();
    }
    verifyOs() {
        if (process.platform === 'win32') {
            throw new Error('Wrong platform');
        }
    }
    getExecutableFilenames() {
        return UnixSamCliLocator.EXECUTABLE_FILENAMES;
    }
    getExecutableFolders() {
        return UnixSamCliLocator.LOCATION_PATHS;
    }
}
UnixSamCliLocator.LOCATION_PATHS = ['/usr/local/bin', '/usr/bin'];
UnixSamCliLocator.EXECUTABLE_FILENAMES = ['sam'];
//# sourceMappingURL=samCliLocator.js.map