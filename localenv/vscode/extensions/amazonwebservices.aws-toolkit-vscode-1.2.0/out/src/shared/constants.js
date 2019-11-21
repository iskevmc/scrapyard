"use strict";
/*!
 * Copyright 2018-2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.extensionSettingsPrefix = 'aws';
exports.regionSettingKey = 'region';
exports.profileSettingKey = 'profile';
exports.mostRecentVersionKey = 'awsToolkitMostRecentVersion';
exports.hostedFilesBaseUrl = 'https://d3rrggjwfhwld2.cloudfront.net/';
exports.endpointsFileUrl = 'https://aws-toolkit-endpoints.s3.amazonaws.com/endpoints.json';
exports.aboutCredentialsFileUrl = 'https://docs.aws.amazon.com/cli/latest/userguide/cli-config-files.html';
exports.samAboutInstallUrl = 'https://aws.amazon.com/serverless/sam/';
// tslint:disable-next-line:max-line-length
exports.vscodeMarketplaceUrl = 'https://marketplace.visualstudio.com/items?itemName=AmazonWebServices.aws-toolkit-vscode';
exports.githubUrl = 'https://github.com/aws/aws-toolkit-vscode';
exports.reportIssueUrl = `${exports.githubUrl}/issues/new/choose`;
exports.documentationUrl = 'https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/welcome.html';
// tslint:disable-next-line:max-line-length
exports.credentialHelpUrl = 'https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/setup-credentials.html';
// URLs for samInitWizard
exports.samInitDocUrl = 'https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/create-sam.html';
// URLs for samDeployWizard
// tslint:disable-next-line:max-line-length
exports.samDeployDocUrl = 'https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/deploy-serverless-app.html';
const npmPackage = () => require('../../../package.json');
exports.pluginVersion = npmPackage().version;
//# sourceMappingURL=constants.js.map