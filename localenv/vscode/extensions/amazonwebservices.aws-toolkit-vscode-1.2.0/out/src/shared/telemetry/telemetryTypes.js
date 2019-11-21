"use strict";
/*!
 * Copyright 2018-2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACCOUNT_METADATA_KEY = 'awsAccount';
var TelemetryNamespace;
(function (TelemetryNamespace) {
    TelemetryNamespace["Aws"] = "aws";
    TelemetryNamespace["Cloudformation"] = "cloudformation";
    TelemetryNamespace["Lambda"] = "lambda";
    TelemetryNamespace["Project"] = "project";
    TelemetryNamespace["Session"] = "session";
})(TelemetryNamespace = exports.TelemetryNamespace || (exports.TelemetryNamespace = {}));
var AccountStatus;
(function (AccountStatus) {
    AccountStatus["NotApplicable"] = "n/a";
    AccountStatus["NotSet"] = "not-set";
    AccountStatus["Invalid"] = "invalid";
})(AccountStatus = exports.AccountStatus || (exports.AccountStatus = {}));
exports.METADATA_FIELD_NAME = {
    RESULT: 'result',
    DURATION: 'duration',
    REASON: 'reason'
};
var MetadataResult;
(function (MetadataResult) {
    MetadataResult["Pass"] = "Succeeded";
    MetadataResult["Fail"] = "Failed";
    MetadataResult["Cancel"] = "Cancelled";
})(MetadataResult = exports.MetadataResult || (exports.MetadataResult = {}));
//# sourceMappingURL=telemetryTypes.js.map