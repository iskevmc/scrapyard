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
const glob = require("glob-promise");
const path = require("path");
const portfinder = require("portfinder");
const util = require("util");
const vscode = require("vscode");
const PackageReader_1 = require("./utility/PackageReader");
const CsProjectUtility_1 = require("./utility/CsProjectUtility");
const PomXmlUtility_1 = require("./utility/PomXmlUtility");
const RecognizerResult_1 = require("./models/RecognizerResult");
const existsAsync = util.promisify(fs.exists);
class ServiceClassifier {
    constructor(pwd, logger) {
        this._pwd = pwd;
        this._logger = logger;
    }
    runAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            var recognizerResults = yield Promise.all([
                new NodejsRecognizer(this._logger).runAsync(this._pwd),
                new DotnetcoreRecognizer().runAsync(this._pwd),
                new JavaMavenRecognizer().runAsync(this._pwd)
            ]);
            for (const recognizerResult of recognizerResults) {
                if (recognizerResult.identifier != RecognizerResult_1.LanguageIdentifier.Unknown) {
                    return recognizerResult;
                }
            }
            return new RecognizerResult_1.RecognizerResult(RecognizerResult_1.LanguageIdentifier.Unknown);
        });
    }
    static getAdditionalProperties(recognizerResult) {
        return __awaiter(this, void 0, void 0, function* () {
            // No need to do any work if not for java language
            if (recognizerResult.identifier != RecognizerResult_1.LanguageIdentifier.JavaMaven) {
                return true;
            }
            const extension = ServiceClassifier.getJavaDebbugerExtension();
            if (!extension) {
                return false;
            }
            const plugin = yield extension.activate();
            if (!plugin.contributor) {
                throw new Error("The Java Debugger for Azure Dev Spaces extension is not installed or has been disabled.");
            }
            const { _, provideTemplateSetting } = plugin.contributor();
            let prepData = yield provideTemplateSetting();
            if (!prepData) {
                return false;
            }
            if (prepData.persist) {
                recognizerResult.properties['projectName'] = prepData.persist.projectName;
                recognizerResult.properties['mainClass'] = prepData.persist.mainClass;
            }
            recognizerResult.properties['prepData'] = prepData;
            return true;
        });
    }
    static getJavaDebbugerExtension() {
        // Get the Java debugger extension, or fail
        let extension = vscode.extensions.getExtension("vscjava.vscode-java-debugger-azds");
        if (!extension) {
            vscode.window.showErrorMessage("The Java Debugger for Azure Dev Spaces extension must be installed and enabled to prepare configuration files.", "Open Extension").then(action => {
                if (action) {
                    vscode.commands.executeCommand("extension.open", "vscjava.vscode-java-debugger-azds");
                }
            });
            return null;
        }
        return extension;
    }
}
exports.ServiceClassifier = ServiceClassifier;
class DotnetcoreRecognizer {
    constructor() {
        this.identifier = RecognizerResult_1.LanguageIdentifier.Dotnetcore;
    }
    runAsync(pwd) {
        return __awaiter(this, void 0, void 0, function* () {
            const files = yield glob('*.csproj', { cwd: pwd });
            let recognizerResult = new RecognizerResult_1.RecognizerResult(files.length > 0 ? RecognizerResult_1.LanguageIdentifier.Dotnetcore : RecognizerResult_1.LanguageIdentifier.Unknown);
            if (recognizerResult.identifier == RecognizerResult_1.LanguageIdentifier.Unknown) {
                return recognizerResult;
            }
            let vsdbgImageRepoName = "azds";
            if (process.env.AZDS_ENVIRONMENT) {
                switch (process.env.AZDS_ENVIRONMENT.toLowerCase()) {
                    case "dev":
                    case "development":
                    case "local":
                    case "test":
                        vsdbgImageRepoName = "azdsdev";
                        break;
                    case "staging":
                        vsdbgImageRepoName = "azdsstage";
                        break;
                }
            }
            // Add tokens
            recognizerResult.properties = {};
            recognizerResult.properties['import'] = vsdbgImageRepoName + '/azds-vsdbg:15.4@/vsdbg:/vsdbg';
            const filePath = path.join(pwd, files[0]);
            if (filePath == null || !(yield existsAsync(filePath))) {
                throw new Error(`Invalid file path "${filePath}".`);
            }
            const csProjectUtility = new CsProjectUtility_1.CsProjectUtility(filePath);
            recognizerResult.properties['frameworkVersion'] = yield csProjectUtility.getTargetFrameworkOrDefaultAsync();
            recognizerResult.properties['programName'] = yield csProjectUtility.getAssemblyNameAsync(); // For dotnet projects, check if there is an assembly name mentioned by parsing the .csproj file
            return recognizerResult;
        });
    }
}
class NodejsRecognizer {
    constructor(logger) {
        this.identifier = RecognizerResult_1.LanguageIdentifier.Nodejs;
        this._logger = logger;
    }
    runAsync(pwd) {
        return __awaiter(this, void 0, void 0, function* () {
            const files = yield glob('package.json', { cwd: pwd });
            let recognizerResult = new RecognizerResult_1.RecognizerResult(files.length > 0 ? RecognizerResult_1.LanguageIdentifier.Nodejs : RecognizerResult_1.LanguageIdentifier.Unknown);
            if (recognizerResult.identifier == RecognizerResult_1.LanguageIdentifier.Unknown) {
                return recognizerResult;
            }
            // Detect & add tokens
            const packageReader = new PackageReader_1.PackageReader(path.join(pwd, 'package.json'), this._logger);
            const mainJS = yield packageReader.detectOrDefaultMainJsAsync();
            recognizerResult.properties = {};
            recognizerResult.properties['mainJS'] = mainJS;
            recognizerResult.properties['configIds'] = new Set();
            recognizerResult.properties['configIds'].add('AZDS-LAUNCH');
            // Check for existance of nodemon in 'devDependecies'
            if (packageReader.devDependenciesContains('nodemon')) {
                recognizerResult.properties['configIds'].add('AZDS-WATCH-ATTACH');
            }
            const basePort = Math.floor(Math.random() * 10000 + 50000); // basePort between [50000, 60000)
            const port = yield portfinder.getPortPromise({ port: basePort });
            recognizerResult.properties['randomPort1'] = port.toString();
            return recognizerResult;
        });
    }
}
class JavaMavenRecognizer {
    constructor() {
        this.identifier = RecognizerResult_1.LanguageIdentifier.JavaMaven;
    }
    runAsync(pwd) {
        return __awaiter(this, void 0, void 0, function* () {
            const files = yield glob('pom.xml', { cwd: pwd });
            let recognizerResult = new RecognizerResult_1.RecognizerResult(files.length > 0 ? RecognizerResult_1.LanguageIdentifier.JavaMaven : RecognizerResult_1.LanguageIdentifier.Unknown);
            if (recognizerResult.identifier == RecognizerResult_1.LanguageIdentifier.Unknown) {
                return recognizerResult;
            }
            const extension = ServiceClassifier.getJavaDebbugerExtension();
            if (!extension) {
                return Promise.reject(null);
            }
            // Detect & add tokens
            const filePath = path.join(pwd, 'pom.xml');
            if (filePath == null || !(yield existsAsync(filePath))) {
                throw new Error(`Invalid file path "${filePath}".`);
            }
            const pomXmlUtility = new PomXmlUtility_1.PomXmlUtility(filePath);
            recognizerResult.properties = {};
            recognizerResult.properties['artifactId'] = yield pomXmlUtility.getArtifactIdAsync();
            recognizerResult.properties['version'] = yield pomXmlUtility.getArtifactVersionAsync();
            recognizerResult.properties['import'] = 'azuredevjava/javadebug:' + extension.packageJSON.version + '@/javadebug:/javadebug';
            const basePort = Math.floor(Math.random() * 10000 + 50000); // basePort between [50000, 60000)
            const port = yield portfinder.getPortPromise({ port: basePort });
            recognizerResult.properties['randomPort1'] = port.toString();
            return recognizerResult;
        });
    }
}
//# sourceMappingURL=ServiceClassifier.js.map