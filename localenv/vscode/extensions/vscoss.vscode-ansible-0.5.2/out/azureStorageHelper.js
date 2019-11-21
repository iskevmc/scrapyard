'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const storage = require("azure-storage");
const path = require("path");
const DIRECTORY_NAME = 'ansible-playbooks';
function uploadFilesToAzureStorage(localFileName, storageAccountName, storageAccountKey, fileShareName) {
    const client = createFileServiceWithSAS(storageAccountName, storageAccountKey, getStorageHostUri(storageAccountName));
    return createFileShare(client, fileShareName)
        .then(() => {
        return createDirectory(client, fileShareName, DIRECTORY_NAME);
    })
        .then(() => {
        return createFile(client, fileShareName, DIRECTORY_NAME, path.basename(localFileName), localFileName);
    })
        .catch((err) => { throw err; });
}
exports.uploadFilesToAzureStorage = uploadFilesToAzureStorage;
function createFileShare(client, fileShareName) {
    return new Promise((resolve, reject) => {
        client.createShareIfNotExists(fileShareName, (err, result, response) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}
function createDirectory(client, fileShareName, dirname) {
    return new Promise((resolve, reject) => {
        client.createDirectoryIfNotExists(fileShareName, dirname, (err, result, response) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}
function createFile(client, fileShare, dirName, src, dest) {
    return new Promise((resolve, reject) => {
        client.createFileFromLocalFile(fileShare, dirName, src, dest, (err, result, response) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}
function getCloudShellPlaybookPath(fileShareName, playbook) {
    return './clouddrive/' + DIRECTORY_NAME + '/' + path.basename(playbook);
}
exports.getCloudShellPlaybookPath = getCloudShellPlaybookPath;
function createFileServiceWithSAS(storageAccountName, storageAccountKey, hostUri) {
    let sas = storage.generateAccountSharedAccessSignature(storageAccountName, storageAccountKey, getSharedPolicy());
    var fileServiceWithShareSas = storage.createFileServiceWithSas(hostUri, sas);
    return fileServiceWithShareSas;
}
function getStorageHostUri(accountName) {
    return "https://" + accountName + ".file.core.windows.net";
}
function getSharedPolicy() {
    let startDate = new Date((new Date()).toUTCString());
    let endDate = new Date(startDate);
    startDate.setMinutes(startDate.getMinutes() - 5);
    endDate.setHours(endDate.getHours() + 3);
    return {
        AccessPolicy: {
            Services: 'f',
            ResourceTypes: 'sco',
            Permissions: 'racupwdl',
            Start: startDate,
            Expiry: endDate
        }
    };
}
;
//# sourceMappingURL=azureStorageHelper.js.map