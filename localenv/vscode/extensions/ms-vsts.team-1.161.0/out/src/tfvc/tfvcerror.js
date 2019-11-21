/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strings_1 = require("../helpers/strings");
class TfvcError {
    constructor(data) {
        this.messageOptions = [];
        if (!data) {
            throw TfvcError.CreateArgumentMissingError("data");
        }
        if (data.error) {
            this.error = data.error;
            this.message = data.error.message;
        }
        else {
            this.error = undefined;
        }
        this.message = this.message || data.message || strings_1.Strings.TfExecFailedError;
        this.messageOptions = data.messageOptions || [];
        this.stdout = data.stdout;
        this.stderr = data.stderr;
        this.exitCode = data.exitCode;
        this.tfvcErrorCode = data.tfvcErrorCode;
        this.tfvcCommand = data.tfvcCommand;
    }
    static CreateArgumentMissingError(argumentName) {
        return new TfvcError({
            // This is a developer error - no need to localize
            message: `Argument is required: ${argumentName}`,
            tfvcErrorCode: TfvcErrorCodes.MissingArgument
        });
    }
    /**
     * Only throw this error in the case where you detect an invalid state and cannot continue.
     */
    static CreateInvalidStateError() {
        return new TfvcError({
            message: "The TFVC SCMProvider is in an invalid state for this action.",
            tfvcErrorCode: TfvcErrorCodes.InInvalidState
        });
    }
    static CreateUnknownError(err) {
        return new TfvcError({
            error: err,
            message: err.message,
            tfvcErrorCode: TfvcErrorCodes.UnknownError
        });
    }
    toString() {
        let result = this.message + " Details: " +
            `exitCode: ${this.exitCode}, ` +
            `errorCode: ${this.tfvcErrorCode}, ` +
            `command: ${this.tfvcCommand}, ` +
            `stdout: ${this.stdout}, ` +
            `stderr: ${this.stderr}`;
        if (this.error) {
            result += " Stack: " + this.error.stack;
        }
        return result;
    }
}
exports.TfvcError = TfvcError;
class TfvcErrorCodes {
    static get MissingArgument() { return "MissingArgument"; }
    static get AuthenticationFailed() { return "AuthenticationFailed"; }
    static get NotAuthorizedToAccess() { return "NotAuthorizedToAccess"; }
    static get NotATfvcRepository() { return "NotATfvcRepository"; }
    static get NotAnEnuTfCommandLine() { return "NotAnEnuTfCommandLine"; }
    static get LocationMissing() { return "TfvcLocationMissing"; }
    static get NotFound() { return "TfvcNotFound"; }
    static get MinVersionWarning() { return "TfvcMinVersionWarning"; }
    static get RepositoryNotFound() { return "RepositoryNotFound"; }
    static get FileNotInMappings() { return "FileNotInMappings"; }
    static get FileNotInWorkspace() { return "FileNotInWorkspace"; }
    static get InInvalidState() { return "TfvcInInvalidState"; }
    static get NoItemsMatch() { return "TfvcNoItemsMatch"; }
    static get UnknownError() { return "UnknownError"; }
    static get WorkspaceNotKnownToClc() { return "WorkspaceNotKnownToClc"; }
}
exports.TfvcErrorCodes = TfvcErrorCodes;
;

//# sourceMappingURL=tfvcerror.js.map
