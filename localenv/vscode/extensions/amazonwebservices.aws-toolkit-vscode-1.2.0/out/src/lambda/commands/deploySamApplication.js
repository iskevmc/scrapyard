"use strict";
/*!
 * Copyright 2018-2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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
const del = require("del");
const path = require("path");
const vscode = require("vscode");
const nls = require("vscode-nls");
const awsContext_1 = require("../../shared/awsContext");
const filesystemUtilities_1 = require("../../shared/filesystemUtilities");
const samCliBuild_1 = require("../../shared/sam/cli/samCliBuild");
const samCliContext_1 = require("../../shared/sam/cli/samCliContext");
const samCliDeploy_1 = require("../../shared/sam/cli/samCliDeploy");
const samCliPackage_1 = require("../../shared/sam/cli/samCliPackage");
const samCliValidationUtils_1 = require("../../shared/sam/cli/samCliValidationUtils");
const messages_1 = require("../../shared/utilities/messages");
const samDeployWizard_1 = require("../wizards/samDeployWizard");
const localize = nls.loadMessageBundle();
function deploySamApplication({ samCliContext = samCliContext_1.getSamCliContext(), channelLogger, regionProvider, extensionContext, samDeployWizard = getDefaultSamDeployWizardResponseProvider(regionProvider, extensionContext) }, { awsContext, window = getDefaultWindowFunctions() }) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const profile = awsContext.getCredentialProfileName();
            if (!profile) {
                throw new awsContext_1.NoActiveCredentialError();
            }
            samCliValidationUtils_1.throwAndNotifyIfInvalid(yield samCliContext.validator.detectValidSamCli());
            const deployWizardResponse = yield samDeployWizard.getSamDeployWizardResponse();
            if (!deployWizardResponse) {
                return;
            }
            const deployParameters = {
                deployRootFolder: yield filesystemUtilities_1.makeTemporaryToolkitFolder('samDeploy'),
                destinationStackName: deployWizardResponse.stackName,
                packageBucketName: deployWizardResponse.s3Bucket,
                parameterOverrides: deployWizardResponse.parameterOverrides,
                profile,
                region: deployWizardResponse.region,
                sourceTemplatePath: deployWizardResponse.template.fsPath
            };
            const deployApplicationPromise = deploy({
                deployParameters,
                channelLogger,
                invoker: samCliContext.invoker,
                window
            }).then(() => __awaiter(this, void 0, void 0, function* () {
                // The parent method will exit shortly, and the status bar will run this promise
                // Cleanup has to be chained into the promise as a result.
                return yield del(deployParameters.deployRootFolder, {
                    force: true
                });
            }));
            window.setStatusBarMessage(localize('AWS.samcli.deploy.statusbar.message', '$(cloud-upload) Deploying SAM Application to {0}...', deployWizardResponse.stackName), deployApplicationPromise);
        }
        catch (err) {
            outputDeployError(err, channelLogger);
        }
    });
}
exports.deploySamApplication = deploySamApplication;
function getBuildRootFolder(deployRootFolder) {
    return path.join(deployRootFolder, 'build');
}
function getBuildTemplatePath(deployRootFolder) {
    // Assumption: sam build will always produce a template.yaml file.
    // If that is not the case, revisit this logic.
    return path.join(getBuildRootFolder(deployRootFolder), 'template.yaml');
}
function getPackageTemplatePath(deployRootFolder) {
    return path.join(deployRootFolder, 'template.yaml');
}
function buildOperation(params) {
    return __awaiter(this, void 0, void 0, function* () {
        params.channelLogger.info('AWS.samcli.deploy.workflow.init', 'Building SAM Application...');
        const buildDestination = getBuildRootFolder(params.deployParameters.deployRootFolder);
        const build = new samCliBuild_1.SamCliBuildInvocation({
            buildDir: buildDestination,
            baseDir: undefined,
            templatePath: params.deployParameters.sourceTemplatePath,
            invoker: params.invoker
        });
        yield build.execute();
    });
}
function packageOperation(params) {
    return __awaiter(this, void 0, void 0, function* () {
        params.channelLogger.info('AWS.samcli.deploy.workflow.packaging', 'Packaging SAM Application to S3 Bucket: {0} with profile: {1}', params.deployParameters.packageBucketName, params.deployParameters.profile);
        const buildTemplatePath = getBuildTemplatePath(params.deployParameters.deployRootFolder);
        const packageTemplatePath = getPackageTemplatePath(params.deployParameters.deployRootFolder);
        yield samCliPackage_1.runSamCliPackage({
            sourceTemplateFile: buildTemplatePath,
            destinationTemplateFile: packageTemplatePath,
            profile: params.deployParameters.profile,
            region: params.deployParameters.region,
            s3Bucket: params.deployParameters.packageBucketName
        }, params.invoker, params.channelLogger.logger);
    });
}
function deployOperation(params) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            params.channelLogger.info('AWS.samcli.deploy.workflow.stackName.initiated', 'Deploying SAM Application to CloudFormation Stack: {0} with profile: {1}', params.deployParameters.destinationStackName, params.deployParameters.profile);
            const packageTemplatePath = getPackageTemplatePath(params.deployParameters.deployRootFolder);
            yield samCliDeploy_1.runSamCliDeploy({
                parameterOverrides: params.deployParameters.parameterOverrides,
                profile: params.deployParameters.profile,
                templateFile: packageTemplatePath,
                region: params.deployParameters.region,
                stackName: params.deployParameters.destinationStackName
            }, params.invoker, params.channelLogger.logger);
        }
        catch (err) {
            // Handle sam deploy Errors to supplement the error message prior to writing it out
            const error = err;
            params.channelLogger.logger.error(error);
            const errorMessage = enhanceAwsCloudFormationInstructions(String(err), params.deployParameters);
            params.channelLogger.channel.appendLine(errorMessage);
            throw new Error('Deploy failed');
        }
    });
}
function deploy(params) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            params.channelLogger.channel.show(true);
            params.channelLogger.info('AWS.samcli.deploy.workflow.start', 'Starting SAM Application deployment...');
            yield buildOperation(params);
            yield packageOperation(params);
            yield deployOperation(params);
            params.channelLogger.info('AWS.samcli.deploy.workflow.success', 'Successfully deployed SAM Application to CloudFormation Stack: {0} with profile: {1}', params.deployParameters.destinationStackName, params.deployParameters.profile);
            params.window.showInformationMessage(localize('AWS.samcli.deploy.workflow.success.general', 'SAM Application deployment succeeded.'));
        }
        catch (err) {
            outputDeployError(err, params.channelLogger);
            params.window.showErrorMessage(localize('AWS.samcli.deploy.workflow.error', 'Failed to deploy SAM application.'));
        }
    });
}
function enhanceAwsCloudFormationInstructions(message, deployParameters) {
    // tslint:disable-next-line:max-line-length
    // detect error message from https://github.com/aws/aws-cli/blob/4ff0cbacbac69a21d4dd701921fe0759cf7852ed/awscli/customizations/cloudformation/exceptions.py#L42
    // and append region to assist in troubleshooting the error
    // (command uses CLI configured value--users that don't know this and omit region won't see error)
    // tslint:disable-next-line:max-line-length
    if (message.includes(`aws cloudformation describe-stack-events --stack-name ${deployParameters.destinationStackName}`)) {
        message += ` --region ${deployParameters.region}`;
        if (deployParameters.profile) {
            message += ` --profile ${deployParameters.profile}`;
        }
    }
    return message;
}
function outputDeployError(error, channelLogger) {
    channelLogger.logger.error(error);
    if (error.message) {
        channelLogger.channel.appendLine(error.message);
    }
    const checkLogsMessage = messages_1.makeCheckLogsMessage();
    channelLogger.channel.show(true);
    channelLogger.error('AWS.samcli.deploy.general.error', 'An error occurred while deploying a SAM Application. {0}', checkLogsMessage);
}
function getDefaultWindowFunctions() {
    return {
        setStatusBarMessage: vscode.window.setStatusBarMessage,
        showErrorMessage: vscode.window.showErrorMessage,
        showInformationMessage: vscode.window.showInformationMessage
    };
}
function getDefaultSamDeployWizardResponseProvider(regionProvider, context) {
    return {
        getSamDeployWizardResponse: () => __awaiter(this, void 0, void 0, function* () {
            const wizard = new samDeployWizard_1.SamDeployWizard(regionProvider, new samDeployWizard_1.DefaultSamDeployWizardContext());
            return wizard.run();
        })
    };
}
//# sourceMappingURL=deploySamApplication.js.map