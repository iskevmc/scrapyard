/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tfvcerror_1 = require("../tfvcerror");
/**
 * Create an instance of this class to build up the arguments that should be passed to the command line.
 */
class ArgumentBuilder {
    constructor(command, serverContext, skipCollectionOption) {
        this._arguments = [];
        this._secretArgumentIndexes = [];
        if (!command) {
            throw tfvcerror_1.TfvcError.CreateArgumentMissingError("command");
        }
        this.Add(command);
        this.AddSwitch("noprompt");
        if (serverContext && serverContext.RepoInfo && serverContext.RepoInfo.CollectionUrl) {
            if (!skipCollectionOption) {
                //TODO decode URI since CLC does not expect encoded collection urls
                this.AddSwitchWithValue("collection", serverContext.RepoInfo.CollectionUrl, false);
            }
            if (serverContext.CredentialInfo) {
                this.AddSwitchWithValue("login", (serverContext.CredentialInfo.Domain ? serverContext.CredentialInfo.Domain + "\\" : "") + serverContext.CredentialInfo.Username + "," + serverContext.CredentialInfo.Password, true);
            }
        }
    }
    Add(arg) {
        this._arguments.push(arg);
        return this;
    }
    AddAll(args) {
        if (args) {
            for (let i = 0; i < args.length; i++) {
                this.Add(args[i]);
            }
        }
        return this;
    }
    AddSecret(arg) {
        this.Add(arg);
        this._secretArgumentIndexes.push(this._arguments.length - 1);
        return this;
    }
    AddSwitch(switchName) {
        return this.AddSwitchWithValue(switchName, undefined, false);
    }
    AddSwitchWithValue(switchName, switchValue, isSecret) {
        let arg;
        if (!switchValue) {
            arg = "-" + switchName;
        }
        else {
            arg = "-" + switchName + ":" + switchValue;
        }
        if (isSecret) {
            this.AddSecret(arg);
        }
        else {
            this.Add(arg);
        }
        return this;
    }
    Build() {
        return this._arguments;
    }
    /**
     * This method builds all the arguments into a single command line. This is needed if
     * a response file is needed for the commands.
     */
    BuildCommandLine() {
        let result = "";
        this._arguments.forEach((arg) => {
            const escapedArg = this.escapeArgument(arg);
            result += escapedArg + " ";
        });
        result += "\n";
        return result;
    }
    /**
     * Command line arguments should have all embedded double quotes repeated to escape them.
     * They should also be surrounded by double quotes if they contain a space (or other whitespace).
     */
    escapeArgument(arg) {
        if (!arg) {
            return arg;
        }
        let escaped = arg.replace(/\"/g, "\"\"");
        if (/\s/.test(escaped)) {
            escaped = "\"" + escaped + "\"";
        }
        return escaped;
    }
    ToString() {
        let output = "";
        for (let i = 0; i < this._arguments.length; i++) {
            let arg = this._arguments[i];
            if (this._secretArgumentIndexes.indexOf(i) >= 0) {
                // This arg is a secret so hide the value
                arg = "********";
            }
            output += arg + " ";
        }
        return output.trim();
    }
    /* IArgumentProvider Implementation - START */
    GetCommand() {
        return this._arguments.length > 0 ? this._arguments[0] : "";
    }
    GetArguments() {
        return this.Build();
    }
    GetCommandLine() {
        return this.BuildCommandLine();
    }
    GetArgumentsForDisplay() {
        return this.ToString();
    }
    AddProxySwitch(proxy) {
        this.AddSwitchWithValue("proxy", proxy, false);
    }
}
exports.ArgumentBuilder = ArgumentBuilder;

//# sourceMappingURL=argumentbuilder.js.map
