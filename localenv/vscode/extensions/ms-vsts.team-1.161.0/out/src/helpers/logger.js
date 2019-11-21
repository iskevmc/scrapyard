/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
const winston = require("winston");
const path = require("path");
class Logger {
    static initalize() {
        //Only initialize the logger if a logging level is set (in settings) and we haven't initialized it yet
        if (Logger.loggingLevel !== undefined && Logger.initialized === false) {
            const fileOpt = { json: false, filename: path.join(Logger.logPath, constants_1.Constants.ExtensionName + "-extension.log"),
                level: LoggingLevel[Logger.loggingLevel].toLowerCase(), maxsize: 4000000,
                maxFiles: 5, tailable: false };
            winston.add(winston.transports.File, fileOpt);
            winston.remove(winston.transports.Console);
            Logger.initialized = true;
        }
    }
    static addPid(message) {
        return " [" + Logger.addZero(process.pid, 10000) + "] " + message;
    }
    static LogDebug(message) {
        Logger.initalize();
        if (Logger.initialized === true && this.loggingLevel === LoggingLevel.Debug) {
            winston.log("debug", this.addPid(message));
            console.log(Logger.getNow() + message);
        }
    }
    //Logs message to console and winston logger
    static LogError(message) {
        Logger.initalize();
        if (Logger.initialized === true && this.loggingLevel >= LoggingLevel.Error) {
            winston.log("error", this.addPid(message));
            console.log(Logger.getNow() + "ERROR: " + message);
        }
        //When displaying messages, don't add timestamp or our severity level prefix
    }
    //Logs message only to console
    static LogInfo(message) {
        Logger.initalize();
        if (Logger.initialized === true && this.loggingLevel >= LoggingLevel.Info) {
            winston.log("info", " " + this.addPid(message)); //five-wide
            console.log(Logger.getNow() + message);
        }
    }
    static LogObject(object) {
        Logger.initalize();
        if (Logger.initialized === true && this.loggingLevel === LoggingLevel.Debug) {
            winston.log("debug", object);
            console.log(object);
        }
    }
    //Logs message to console and displays Warning message
    static LogWarning(message) {
        Logger.initalize();
        if (Logger.initialized === true && this.loggingLevel >= LoggingLevel.Warn) {
            winston.log("warn", " " + this.addPid(message)); //five-wide
            console.log(Logger.getNow() + "WARNING: " + message);
        }
        //When displaying messages, don't add timestamp or our severity level prefix
    }
    static get LogPath() {
        return Logger.logPath;
    }
    static set LogPath(path) {
        if (path !== undefined) {
            Logger.logPath = path;
        }
    }
    static get LoggingLevel() {
        return Logger.loggingLevel;
    }
    static SetLoggingLevel(level) {
        if (level === undefined) {
            Logger.loggingLevel = undefined;
            return;
        }
        switch (level.toLowerCase()) {
            case "error":
                Logger.loggingLevel = LoggingLevel.Error;
                break;
            case "warn":
                Logger.loggingLevel = LoggingLevel.Warn;
                break;
            case "info":
                Logger.loggingLevel = LoggingLevel.Info;
                break;
            case "verbose":
                Logger.loggingLevel = LoggingLevel.Verbose;
                break;
            case "debug":
                Logger.loggingLevel = LoggingLevel.Debug;
                break;
            default:
                Logger.loggingLevel = undefined;
                break;
        }
    }
    //Returns string representation of now()
    static get Now() {
        return Logger.getNow();
    }
    static getNow() {
        const now = new Date();
        const strDateTime = [[Logger.addZero(now.getHours()), Logger.addZero(now.getMinutes()), Logger.addZero(now.getSeconds())].join(":"),
            Logger.addZero(now.getMilliseconds(), 100)].join(".");
        return strDateTime + " ";
    }
    //Adds a preceding zero if num is less than base (or the default of 10)
    static addZero(num, base) {
        let val = base;
        if (val === undefined) {
            val = 10;
        }
        return (num >= 0 && num < val) ? "0" + num.toString() : num.toString() + "";
    }
}
Logger.initialized = false;
Logger.logPath = "";
exports.Logger = Logger;
var LoggingLevel;
(function (LoggingLevel) {
    LoggingLevel[LoggingLevel["Error"] = 0] = "Error";
    LoggingLevel[LoggingLevel["Warn"] = 1] = "Warn";
    LoggingLevel[LoggingLevel["Info"] = 2] = "Info";
    LoggingLevel[LoggingLevel["Verbose"] = 3] = "Verbose";
    LoggingLevel[LoggingLevel["Debug"] = 4] = "Debug";
})(LoggingLevel = exports.LoggingLevel || (exports.LoggingLevel = {}));

//# sourceMappingURL=logger.js.map
