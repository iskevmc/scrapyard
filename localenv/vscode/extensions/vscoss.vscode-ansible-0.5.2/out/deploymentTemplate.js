'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const constants_1 = require("./constants");
const telemetryClient_1 = require("./telemetryClient");
const azureHelpers_1 = require("./azureHelpers");
const yamljs = require("yamljs");
const sourceTreeHelpers_1 = require("./sourceTreeHelpers");
const playbookManager_1 = require("./playbookManager");
var Azure = new azureHelpers_1.AzureHelpers();
var pm = new playbookManager_1.PlaybookManager();
const indent2space = "  ";
class DeploymentTemplate extends sourceTreeHelpers_1.SourceTreeHelpers {
    constructor() {
        super();
    }
    displayDeploymentTemplateMenu() {
        telemetryClient_1.TelemetryClient.sendEvent('deploymenttemplate', { 'action': 'menu' });
        // currently only one option is available, so first menu won't be displayed yet
        let items = [];
        items.push({ label: "Quickstart Template", description: "Select Azure quickstart template" });
        items.push({ label: "Resource Group", description: "Create template from existing resource group" });
        vscode.window.showQuickPick(items).then(selection => {
            // the user canceled the selection
            if (!selection)
                return;
            if (selection.label == "Quickstart Template") {
                this.selectQuickstartTemplate();
            }
            else if (selection.label == "Resource Group") {
                this.createFromResourceGroup();
            }
        });
    }
    selectQuickstartTemplate() {
        let __this = this;
        let repo = constants_1.Constants.AzureQuickStartTemplates;
        this.queryDirectory('https://' + constants_1.Constants.GitHubApiHost + '/repos/' + repo + '/contents/', false, function (dirs) {
            let items = [];
            for (var i in dirs) {
                // list only directories and skip known directories that don't contain templates
                if (!dirs[i].startsWith('.')) {
                    items.push({ label: dirs[i], description: null });
                }
            }
            vscode.window.showQuickPick(items).then(selection => {
                // the user canceled the selection
                if (!selection) {
                    return;
                }
                __this.retrieveTemplate(selection.label);
            });
        });
    }
    createFromResourceGroup() {
        let __this = this;
        Azure.queryResourceGroups(function (groups) {
            if (groups != null) {
                vscode.window.showQuickPick(groups).then(selection => {
                    // the user canceled the selection
                    if (!selection)
                        return;
                    Azure.getArmTemplateFromResourceGroup(selection, function (template) {
                        if (template != null) {
                            __this.createPlaybookFromTemplate(null, "", template['template'], true);
                        }
                    });
                });
            }
            else {
                vscode.window.showErrorMessage("Failed to retrieve list of templates");
            }
        });
    }
    retrieveTemplate(templateName) {
        let __this = this;
        let repo = constants_1.Constants.AzureQuickStartTemplates;
        this.getJson('https://' + constants_1.Constants.GitHubRawContentHost + '/' + repo + '/master/' + templateName + '/azuredeploy.json', function (template) {
            if (template != null) {
                let items = [];
                items.push({ label: "Link", description: "Create link to template using lookup" });
                items.push({ label: "Expand", description: "Expand template inline" });
                vscode.window.showQuickPick(items).then(selection => {
                    // the user canceled the selection
                    if (!selection)
                        return;
                    __this.createPlaybookFromTemplate(null, "https://" + constants_1.Constants.GitHubRawContentHost + "/" + repo + "/master/" + templateName + "/azuredeploy.json", template, (selection.label == 'Expand'));
                });
            }
            else {
                vscode.window.showErrorMessage("Failed to retrieve template");
            }
        });
    }
    createPlaybookFromTemplate(prefixPlaybook, location, template, expand) {
        let __this = this;
        telemetryClient_1.TelemetryClient.sendEvent('deploymenttemplate', { 'action': 'inserted', 'template': location });
        let playbook = "";
        if (prefixPlaybook != null) {
            for (var l in prefixPlaybook)
                playbook += prefixPlaybook[l] + "\r";
        }
        const indent4space = indent2space.repeat(2);
        const indent6space = indent2space.repeat(3);
        playbook +=
            "- name: Create resource using Azure deployment template\r" +
                indent2space + "azure_rm_deployment:\r" +
                indent4space + "resource_group_name: ${1:your-resource-group}\r" +
                indent4space + "location: ${2:eastus}\r" +
                indent4space + "state: present\r" +
                indent4space + "parameters:\r";
        let tabstop = 3;
        for (var p in template['parameters']) {
            if (template['parameters'][p]['defaultValue']) {
                playbook += indent6space + "#" + p + ":\r";
                playbook += indent6space + "#  value: " + template['parameters'][p]['defaultValue'] + "\r";
            }
            else {
                playbook += indent6space + p + ":\r";
                playbook += indent6space + "value: ${" + tabstop++ + "}\r";
            }
        }
        playbook += indent4space + "template:\r";
        if (expand) {
            let templateYaml = yamljs.stringify(template, 10, 2).replace(/[$]/g, "\\$").split(/\r?\n/);
            for (var i = 0; i < templateYaml.length; i++) {
                playbook += indent6space + templateYaml[i] + "\r";
            }
        }
        else {
            playbook += indent4space + "template: \"{{ lookup('url', '" + location + "', split_lines=False) }}\"\r";
        }
        playbook += "$end";
        pm.insertTask(playbook);
    }
}
exports.DeploymentTemplate = DeploymentTemplate;
//# sourceMappingURL=deploymentTemplate.js.map