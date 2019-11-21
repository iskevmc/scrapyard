// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// ----------------------------------------------------------------------------
'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const util = require("util");
const mkdirAsync = util.promisify(fs.mkdir);
class FileLogWriter {
    constructor(context) {
        this.LogFileNameBase = `azds-vscode`;
        this.LogFileNameExtension = `txt`;
        this.MaxLastLogsLength = 50;
        this._logDirectoryPath = context.logPath;
        this._writePromise = Promise.resolve();
        this._lastLogs = new Array();
    }
    initializeAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logFilePath = yield this.getLogFilePathAsync(this._logDirectoryPath);
            // Get a stream on the file as "Appending - File is created if it does not exist".
            this._logWriteStream = fs.createWriteStream(this.logFilePath, { flags: `a`, autoClose: false });
            this._logWriteStream.on(`error`, (error) => {
                // Something went wrong while writing logs. Ignoring.
            });
        });
    }
    write(message) {
        this._writePromise = this._writePromise.then(() => __awaiter(this, void 0, void 0, function* () {
            this._lastLogs.push(message);
            if (this._lastLogs.length > this.MaxLastLogsLength) {
                this._lastLogs.shift();
            }
            return new Promise((resolve, reject) => {
                this._logWriteStream.write(message, (error) => {
                    if (error != null) {
                        // Something went wrong while writing logs. Ignoring.
                    }
                    resolve();
                });
            });
        }));
    }
    closeAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._writePromise;
            this._logWriteStream.end();
        });
    }
    // Returns the last logs stored, so that we can attach them to telemetry in case of errors.
    getLastLogs() {
        return Promise.resolve(this._lastLogs.join(``));
    }
    getLogFilePathAsync(logDirectoryPath) {
        return __awaiter(this, void 0, void 0, function* () {
            // Create log directory if needed.
            try {
                yield mkdirAsync(logDirectoryPath);
            }
            catch (error) {
                if (error.code != `EEXIST`) {
                    // If we get any other error than "already existing folder", let's throw.
                    throw error;
                }
            }
            const logFileName = `${this.LogFileNameBase}-${new Date().toISOString().replace(/:/g, `-`)}.${this.LogFileNameExtension}`;
            return path.join(logDirectoryPath, logFileName);
        });
    }
}
exports.FileLogWriter = FileLogWriter;
//# sourceMappingURL=FileLogWriter.js.map