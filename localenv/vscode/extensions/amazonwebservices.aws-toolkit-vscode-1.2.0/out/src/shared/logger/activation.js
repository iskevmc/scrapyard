"use strict";
/*!
 * Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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
const moment = require("moment");
const os = require("os");
const path = require("path");
const vscode = require("vscode");
const nls = require("vscode-nls");
const constants_1 = require("../constants");
const filesystem_1 = require("../filesystem");
const filesystemUtilities_1 = require("../filesystemUtilities");
const settingsConfiguration_1 = require("../settingsConfiguration");
const telemetryUtils_1 = require("../telemetry/telemetryUtils");
const logger_1 = require("./logger");
const winstonToolkitLogger_1 = require("./winstonToolkitLogger");
const localize = nls.loadMessageBundle();
const LOG_PATH = path.join(getLogBasePath(), 'Code', 'logs', 'aws_toolkit', makeLogFilename());
const DEFAULT_LOG_LEVEL = 'info';
const LOG_OUTPUT_CHANNEL = vscode.window.createOutputChannel('AWS Toolkit Logs');
/**
 * Activate Logger functionality for the extension.
 */
function activate() {
    return __awaiter(this, void 0, void 0, function* () {
        const outputChannel = LOG_OUTPUT_CHANNEL;
        const logPath = LOG_PATH;
        const logLevel = getLogLevel();
        yield ensureLogFolderExists(path.dirname(logPath));
        logger_1.setLogger(makeLogger(logLevel, logPath, outputChannel));
        yield registerLoggerCommands();
        outputChannel.appendLine(localize('AWS.log.fileLocation', 'Error logs for this session are permanently stored in {0}', logPath));
    });
}
exports.activate = activate;
function makeLogger(logLevel, logPath, outputChannel) {
    const logger = new winstonToolkitLogger_1.WinstonToolkitLogger(logLevel);
    logger.logToFile(logPath);
    logger.logToOutputChannel(outputChannel);
    return logger;
}
exports.makeLogger = makeLogger;
function getLogLevel() {
    const configuration = new settingsConfiguration_1.DefaultSettingsConfiguration(constants_1.extensionSettingsPrefix);
    return configuration.readSetting('logLevel', DEFAULT_LOG_LEVEL);
}
function getLogBasePath() {
    if (os.platform() === 'win32') {
        return path.join(os.homedir(), 'AppData', 'Roaming');
    }
    else if (os.platform() === 'darwin') {
        return path.join(os.homedir(), 'Library', 'Application Support');
    }
    else {
        return path.join(os.homedir(), '.config');
    }
}
function makeLogFilename() {
    const m = moment();
    const date = m.format('YYYYMMDD');
    const time = m.format('HHmmss');
    // the 'T' matches VS Code's log file name format
    const datetime = `${date}T${time}`;
    return `aws_toolkit_${datetime}.log`;
}
function ensureLogFolderExists(logFolder) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(yield filesystemUtilities_1.fileExists(logFolder))) {
            yield filesystem_1.mkdir(logFolder, { recursive: true });
        }
    });
}
function registerLoggerCommands() {
    return __awaiter(this, void 0, void 0, function* () {
        telemetryUtils_1.registerCommand({
            command: 'aws.viewLogs',
            callback: () => __awaiter(this, void 0, void 0, function* () { return yield vscode.window.showTextDocument(vscode.Uri.file(path.normalize(LOG_PATH))); })
        });
    });
}
//# sourceMappingURL=activation.js.map