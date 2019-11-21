"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = require("node-fetch");
const semver = require("semver");
const vscode_1 = require("vscode");
const Settings = require("../settings");
const Console_1 = require("./Console");
const PowerShellGitHubReleasesUrl = "https://api.github.com/repos/PowerShell/PowerShell/releases/latest";
const PowerShellGitHubPrereleasesUrl = "https://api.github.com/repos/PowerShell/PowerShell/releases";
class GitHubReleaseInformation {
    constructor(version, assets = []) {
        this.isPreview = false;
        this.version = semver.parse(version);
        if (semver.prerelease(this.version)) {
            this.isPreview = true;
        }
        this.assets = assets;
    }
    static FetchLatestRelease(preview) {
        return __awaiter(this, void 0, void 0, function* () {
            // Fetch the latest PowerShell releases from GitHub.
            let releaseJson;
            if (preview) {
                // This gets all releases and the first one is the latest prerelease if
                // there is a prerelease version.
                releaseJson = (yield node_fetch_1.default(PowerShellGitHubPrereleasesUrl)
                    .then((res) => res.json())).find((release) => release.prerelease);
            }
            else {
                releaseJson = yield node_fetch_1.default(PowerShellGitHubReleasesUrl)
                    .then((res) => res.json());
            }
            return new GitHubReleaseInformation(releaseJson.tag_name, releaseJson.assets);
        });
    }
}
exports.GitHubReleaseInformation = GitHubReleaseInformation;
function InvokePowerShellUpdateCheck(languageServerClient, localVersion, arch, release) {
    return __awaiter(this, void 0, void 0, function* () {
        const options = [
            {
                id: 0,
                title: "Yes",
            },
            {
                id: 1,
                title: "Not now",
            },
            {
                id: 2,
                title: "Do not show this notification again",
            },
        ];
        // If our local version is up-to-date, we can return early.
        if (semver.compare(localVersion, release.version) >= 0) {
            return;
        }
        const commonText = `You have an old version of PowerShell (${localVersion.raw}). The current latest release is ${release.version.raw}.`;
        if (process.platform === "linux") {
            yield vscode_1.window.showInformationMessage(`${commonText} We recommend updating to the latest version.`);
            return;
        }
        const isMacOS = process.platform === "darwin";
        const result = yield vscode_1.window.showInformationMessage(`${commonText} Would you like to update the version? ${isMacOS ? "(Homebrew is required on macOS)" : ""}`, ...options);
        // If the user cancels the notification.
        if (!result) {
            return;
        }
        // Yes choice.
        switch (result.id) {
            // Yes choice.
            case 0:
                let script;
                if (process.platform === "win32") {
                    const msiMatcher = arch === "x86" ?
                        "win-x86.msi" : "win-x64.msi";
                    const assetUrl = release.assets.filter((asset) => asset.name.indexOf(msiMatcher) >= 0)[0].browser_download_url;
                    // Grab MSI and run it.
                    // tslint:disable-next-line: max-line-length
                    script = `
$randomFileName = [System.IO.Path]::GetRandomFileName()
$tmpMsiPath = Microsoft.PowerShell.Management\\Join-Path ([System.IO.Path]::GetTempPath()) "$randomFileName.msi"
Microsoft.PowerShell.Utility\\Invoke-RestMethod -Uri ${assetUrl} -OutFile $tmpMsiPath
try
{
    Microsoft.PowerShell.Management\\Start-Process -Wait -Path $tmpMsiPath
}
finally
{
    Microsoft.PowerShell.Management\\Remove-Item $tmpMsiPath
}`;
                }
                else if (isMacOS) {
                    script = "brew cask upgrade powershell";
                    if (release.isPreview) {
                        script = "brew cask upgrade powershell-preview";
                    }
                }
                yield languageServerClient.sendRequest(Console_1.EvaluateRequestType, {
                    expression: script,
                });
                break;
            // Never choice.
            case 2:
                yield Settings.change("promptToUpdatePowerShell", false, true);
                break;
            default:
                break;
        }
    });
}
exports.InvokePowerShellUpdateCheck = InvokePowerShellUpdateCheck;
//# sourceMappingURL=UpdatePowerShell.js.map