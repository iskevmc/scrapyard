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
const gitcontext_1 = require("../contexts/gitcontext");
const tfvccontext_1 = require("../contexts/tfvccontext");
const externalcontext_1 = require("../contexts/externalcontext");
const tfcommandlinerunner_1 = require("../tfvc/tfcommandlinerunner");
class RepositoryContextFactory {
    //Returns an IRepositoryContext if the repository is either TFS or Team Services
    static CreateRepositoryContext(path, settings) {
        return __awaiter(this, void 0, void 0, function* () {
            let repoContext;
            let initialized = false;
            //Check for remoteUrl and teamProject in settings first
            repoContext = new externalcontext_1.ExternalContext(path);
            initialized = yield repoContext.Initialize(settings);
            if (!initialized) {
                //Check for Git next since it should be faster to determine and this code will
                //be called on Reinitialize (when config changes, for example)
                repoContext = new gitcontext_1.GitContext(path);
                initialized = yield repoContext.Initialize();
                if (!repoContext || repoContext.IsTeamFoundation === false || !initialized) {
                    //Check if we have a TFVC repository
                    repoContext = new tfvccontext_1.TfvcContext(path);
                    initialized = yield repoContext.Initialize();
                    if (!initialized) {
                        return undefined;
                    }
                    if (repoContext.IsTeamFoundation === false) {
                        //We don't have any Team Services repository
                        return undefined;
                    }
                }
            }
            return repoContext;
        });
    }
    /**
     * This method allows the ExtensionManager the ability to update the repository context it obtained with the server context information
     * it has. This provides one source for TFVC classes like Tfvc and Repository.
     * This method doesn't do anything for other types of repository contexts.
     */
    static UpdateRepositoryContext(currentRepo, serverContext) {
        if (currentRepo && currentRepo instanceof tfvccontext_1.TfvcContext) {
            const context = currentRepo;
            context.TfvcRepository = tfcommandlinerunner_1.TfCommandLineRunner.CreateRepository(serverContext, context.RepoFolder);
        }
        return currentRepo;
    }
}
exports.RepositoryContextFactory = RepositoryContextFactory;

//# sourceMappingURL=repocontextfactory.js.map
