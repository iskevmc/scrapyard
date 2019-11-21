/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const constants_1 = require("../helpers/constants");
const logger_1 = require("../helpers/logger");
const strings_1 = require("../helpers/strings");
const util_1 = require("./util");
const tfvcerror_1 = require("./tfvcerror");
const tfvcrepository_1 = require("./tfvcrepository");
const tfvcsettings_1 = require("./tfvcsettings");
const tfvcversion_1 = require("./tfvcversion");
const tfvcoutput_1 = require("./tfvcoutput");
const _ = require("underscore");
const fs = require("fs");
const path = require("path");
/**
 * This is a static class that facilitates running the TFVC command line.
 * To use this class create a repository object or call Exec directly.
 */
class TfCommandLineRunner {
    /**
     * Call this method to get the repository object that allows you to perform TFVC commands.
     */
    static CreateRepository(serverContext, repositoryRootFolder, env = {}) {
        const tfvc = TfCommandLineRunner.GetCommandLine();
        return new tfvcrepository_1.TfvcRepository(serverContext, tfvc, repositoryRootFolder, env, tfvc.isExe);
    }
    static GetCommandLine(localPath) {
        logger_1.Logger.LogDebug(`TFVC Creating Tfvc object with localPath='${localPath}'`);
        // Get Proxy from settings
        const settings = new tfvcsettings_1.TfvcSettings();
        const proxy = settings.Proxy;
        logger_1.Logger.LogDebug(`Using TFS proxy: ${proxy}`);
        let tfvcPath = localPath;
        if (!tfvcPath) {
            // get the location from settings
            tfvcPath = settings.Location;
            logger_1.Logger.LogDebug(`TFVC Retrieved from settings; localPath='${tfvcPath}'`);
            if (!tfvcPath) {
                logger_1.Logger.LogWarning(`TFVC Couldn't find where the TF command lives on disk.`);
                throw new tfvcerror_1.TfvcError({
                    message: strings_1.Strings.TfvcLocationMissingError,
                    tfvcErrorCode: tfvcerror_1.TfvcErrorCodes.LocationMissing
                });
            }
        }
        // check to make sure that the file exists in that location
        const exists = fs.existsSync(tfvcPath);
        if (exists) {
            // if it exists, check to ensure that it's a file and not a folder
            const stats = fs.lstatSync(tfvcPath);
            if (!stats || (!stats.isFile() && !stats.isSymbolicLink())) {
                logger_1.Logger.LogWarning(`TFVC ${tfvcPath} exists but isn't a file or symlink.`);
                throw new tfvcerror_1.TfvcError({
                    message: strings_1.Strings.TfMissingError,
                    tfvcErrorCode: tfvcerror_1.TfvcErrorCodes.NotFound
                });
            }
        }
        else {
            logger_1.Logger.LogWarning(`TFVC ${tfvcPath} does not exist.`);
            throw new tfvcerror_1.TfvcError({
                message: strings_1.Strings.TfMissingError,
                tfvcErrorCode: tfvcerror_1.TfvcErrorCodes.NotFound
            });
        }
        // Determine the min version
        const isExe = path.extname(tfvcPath).toLowerCase() === ".exe";
        let minVersion = "14.0.4"; //CLC min version
        if (isExe) {
            minVersion = "14.102.0"; //Minimum tf.exe version
        }
        return {
            path: tfvcPath,
            minVersion: minVersion,
            isExe: isExe,
            proxy: proxy
        };
    }
    /**
     * This method checks the version of the CLC against the minimum version that we expect.
     * It throws an error if the version does not meet or exceed the minimum.
     */
    static CheckVersion(tfvc, version) {
        if (!version) {
            // If the version isn't set just return
            logger_1.Logger.LogDebug(`TFVC CheckVersion called without a version.`);
            return;
        }
        // check the version of TFVC command line
        logger_1.Logger.LogDebug(`TFVC Minimum required version: ${tfvc.minVersion}`);
        logger_1.Logger.LogDebug(`TFVC (TF.exe, TF.cmd) version: ${version}`);
        const minVersion = tfvcversion_1.TfvcVersion.FromString(tfvc.minVersion);
        const curVersion = tfvcversion_1.TfvcVersion.FromString(version);
        if (tfvcversion_1.TfvcVersion.Compare(curVersion, minVersion) < 0) {
            logger_1.Logger.LogWarning(`TFVC ${version} is less that the min version of ${tfvc.minVersion}.`);
            let options = [];
            if (tfvc.isExe) {
                //Provide more information on how to update tf.exe to the minimum version required
                options = [{ title: strings_1.Strings.VS2015Update3CSR,
                        url: constants_1.Constants.VS2015U3CSRUrl,
                        telemetryId: constants_1.TelemetryEvents.VS2015U3CSR }];
            }
            throw new tfvcerror_1.TfvcError({
                message: `${strings_1.Strings.TfVersionWarning}${minVersion.ToString()}`,
                messageOptions: options,
                tfvcErrorCode: tfvcerror_1.TfvcErrorCodes.MinVersionWarning
            });
        }
    }
    static Exec(tfvc, cwd, args, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            // default to the cwd passed in, but allow options.cwd to overwrite it
            options = _.extend({ cwd }, options || {});
            // TODO: do we want to handle proxies or not for the EXE? for tf.exe the user could simply setup the proxy at the command line.
            //       tf.exe remembers the proxy settings and uses them as it needs to.
            if (tfvc.proxy && !tfvc.isExe) {
                args.AddProxySwitch(tfvc.proxy);
            }
            logger_1.Logger.LogDebug(`TFVC: tf ${args.GetArgumentsForDisplay()}`);
            if (options.log !== false) {
                tfvcoutput_1.TfvcOutput.AppendLine(`tf ${args.GetArgumentsForDisplay()}`);
            }
            return yield TfCommandLineRunner.run(tfvc, args, options, tfvc.isExe);
        });
    }
    static DisposeStatics() {
        if (TfCommandLineRunner._runningInstance) {
            TfCommandLineRunner._runningInstance.kill();
            TfCommandLineRunner._runningInstance = undefined;
        }
    }
    /**
     * The Run method will attempt to use the cached TF process, if possible, to run the command and then
     * return the results. Whether it uses the cached one or starts a new TF process, we will immediately start
     * a new TF instance and for later use.
     */
    static run(tfvc, args, options, isExe) {
        return __awaiter(this, void 0, void 0, function* () {
            const start = new Date().getTime();
            const tfInstance = yield TfCommandLineRunner.getMatchingTfInstance(tfvc, options);
            // now that we have the matching one, start a new process (but don't wait on it to finish)
            TfCommandLineRunner.startNewTfInstance(tfvc, options);
            // Use the tf instance to perform the command
            const argsForStandardInput = args.GetCommandLine();
            const result = yield TfCommandLineRunner.runCommand(argsForStandardInput, tfInstance, isExe);
            // log the results
            const end = new Date().getTime();
            logger_1.Logger.LogDebug(`TFVC: ${args.GetCommand()} exit code: ${result.exitCode} (duration: ${end - start}ms)`);
            return result;
        });
    }
    /**
     * Currently we only cache one TF process. If that process matches the tfvc location and options of the process which
     * has been requested, we simply return the cached instance.
     * If there isn't a match or there isn't one cached, we kill any existing running instance and created a new one.
     */
    static getMatchingTfInstance(tfvc, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!TfCommandLineRunner._runningInstance || tfvc.path !== TfCommandLineRunner._location || !TfCommandLineRunner.optionsMatch(options, TfCommandLineRunner._options)) {
                if (TfCommandLineRunner._runningInstance) {
                    TfCommandLineRunner._runningInstance.kill();
                }
                // spawn a new instance of TF with these options
                return yield TfCommandLineRunner.startNewTfInstance(tfvc, options);
            }
            // return the cached instance
            return TfCommandLineRunner._runningInstance;
        });
    }
    static startNewTfInstance(tfvc, options) {
        return __awaiter(this, void 0, void 0, function* () {
            // Start up a new instance of TF for later use
            TfCommandLineRunner._options = options;
            TfCommandLineRunner._location = tfvc.path;
            TfCommandLineRunner._runningInstance = yield TfCommandLineRunner.spawn(tfvc.path, options);
            return TfCommandLineRunner._runningInstance;
        });
    }
    static optionsMatch(options1, options2) {
        return (!options1 && !options2) || (options1.cwd === options2.cwd);
    }
    static spawn(location, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!options) {
                options = {};
            }
            options.env = _.assign({}, process.env, options.env || {});
            const start = new Date().getTime();
            options.stdio = ["pipe", "pipe", "pipe"];
            const child = yield cp.spawn(location, ["@"], options);
            const end = new Date().getTime();
            logger_1.Logger.LogDebug(`TFVC: spawned new process (duration: ${end - start}ms)`);
            return child;
        });
    }
    static runCommand(argsForStandardInput, child, isExe) {
        return __awaiter(this, void 0, void 0, function* () {
            const disposables = [];
            child.stdin.end(argsForStandardInput, "utf8");
            const once = (ee, name, fn) => {
                ee.once(name, fn);
                disposables.push(util_1.toDisposable(() => ee.removeListener(name, fn)));
            };
            const on = (ee, name, fn) => {
                ee.on(name, fn);
                disposables.push(util_1.toDisposable(() => ee.removeListener(name, fn)));
            };
            const [exitCode, stdout, stderr] = yield Promise.all([
                new Promise((c, e) => {
                    once(child, "error", e);
                    once(child, "exit", c);
                }),
                new Promise((c) => {
                    const buffers = [];
                    on(child.stdout, "data", (b) => {
                        buffers.push(b);
                    });
                    once(child.stdout, "close", () => {
                        let stdout = buffers.join("");
                        if (isExe) {
                            // TF.exe repeats the command line as part of the standard out when using the @ response file options
                            // So, we look for the noprompt option to allow us to know where that line is so we can strip it off
                            const start = stdout.indexOf("-noprompt");
                            if (start >= 0) {
                                const end = stdout.indexOf("\n", start);
                                stdout = stdout.slice(end + 1);
                            }
                        }
                        c(stdout);
                    });
                }),
                new Promise((c) => {
                    const buffers = [];
                    on(child.stderr, "data", (b) => buffers.push(b));
                    once(child.stderr, "close", () => c(buffers.join("")));
                })
            ]);
            util_1.dispose(disposables);
            return { exitCode, stdout, stderr };
        });
    }
}
exports.TfCommandLineRunner = TfCommandLineRunner;

//# sourceMappingURL=tfcommandlinerunner.js.map
