/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Q = require("q");
const soapclient_1 = require("./soapclient");
const useragentprovider_1 = require("../helpers/useragentprovider");
const xmldoc = require("xmldoc");
const url = require("url");
// This class is the 'bridge' between the calling RepositoryInfoClient (which uses the
// async/await pattern) and the SoapClient which (has to) implement the callback pattern
class TfsCatalogSoapClient {
    /* tslint:enable:variable-name */
    constructor(serverUrl, handlers) {
        this.serverUrl = serverUrl;
        this.endpointUrl = url.resolve(serverUrl, "TeamFoundation/Administration/v3.0/CatalogService.asmx");
        this.soapClient = new soapclient_1.SoapClient(useragentprovider_1.UserAgentProvider.UserAgent, handlers);
    }
    /*
        Sample value of the parameter sent to this function:

        <?xml version="1.0" encoding="UTF-8"?>
        <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
        <soap:Body>
            <QueryNodesResponse xmlns="http://microsoft.com/webservices/">
                <QueryNodesResult>
                    <CatalogResourceTypes>
                    <CatalogResourceType Identifier="69a51c5e-c093-447e-a177-a09e47a60974" DisplayName="Organizational Root">
                        <Description>The root of the catalog tree that describes the organizational makeup of the TFS deployment.</Description>
                    </CatalogResourceType>
                    <CatalogResourceType Identifier="14f04669-6779-42d5-8975-184b93650c83" DisplayName="Infrastructure Root">
                        <Description>The root of the catalog tree that describes the physical makeup of the TFS deployment.</Description>
                    </CatalogResourceType>
                    </CatalogResourceTypes>
                    <CatalogResources>
                    <CatalogResource Identifier="0bb849d3-fd55-41eb-9b74-45d974a0fc03" DisplayName="Organizational Root" ResourceTypeIdentifier="69a51c5e-c093-447e-a177-a09e47a60974" TempCorrelationId="0bb849d3-fd55-41eb-9b74-45d974a0fc03" ctype="0" MatchedQuery="true">
                        <Description>The root of the catalog tree that describes the organizational makeup of the TFS deployment.</Description>
                        <CatalogServiceReferences />
                        <Properties />
                        <NodeReferencePaths>
                            <string>3eYRYkJOok6GHrKam0AcAA==</string>
                        </NodeReferencePaths>
                    </CatalogResource>
                    <CatalogResource Identifier="0d3bdb54-52cb-49b4-ac3d-6530f330cfac" DisplayName="Infrastructure Root" ResourceTypeIdentifier="14f04669-6779-42d5-8975-184b93650c83" TempCorrelationId="0d3bdb54-52cb-49b4-ac3d-6530f330cfac" ctype="0" MatchedQuery="true">
                        <Description>The root of the catalog tree that describes the physical makeup of the TFS deployment.</Description>
                        <CatalogServiceReferences />
                        <Properties />
                        <NodeReferencePaths>
                            <string>Vc1S6XwnTEe/isOiPfhmxw==</string>
                        </NodeReferencePaths>
                    </CatalogResource>
                    </CatalogResources>
                    <CatalogNodes>
                    <CatalogNode FullPath="3eYRYkJOok6GHrKam0AcAA==" default="false" ResourceIdentifier="0bb849d3-fd55-41eb-9b74-45d974a0fc03" ParentPath="" ChildItem="3eYRYkJOok6GHrKam0AcAA==" NodeDependenciesIncluded="false" ctype="0" MatchedQuery="true">
                        <NodeDependencies />
                    </CatalogNode>
                    <CatalogNode FullPath="Vc1S6XwnTEe/isOiPfhmxw==" default="false" ResourceIdentifier="0d3bdb54-52cb-49b4-ac3d-6530f330cfac" ParentPath="" ChildItem="Vc1S6XwnTEe/isOiPfhmxw==" NodeDependenciesIncluded="false" ctype="0" MatchedQuery="true">
                        <NodeDependencies />
                    </CatalogNode>
                    </CatalogNodes>
                    <DeletedResources />
                    <DeletedNodeResources />
                    <DeletedNodes />
                    <LocationServiceLastChangeId>4006</LocationServiceLastChangeId>
                </QueryNodesResult>
            </QueryNodesResponse>
        </soap:Body>
        </soap:Envelope>
    */
    parseOrganizationRootPath(envelopeXml) {
        if (!envelopeXml) {
            throw new Error(`No SOAP envelope was received for OrganizationRoot from ${this.endpointUrl}`);
        }
        const organizationDocument = new xmldoc.XmlDocument(envelopeXml);
        const soapBody = organizationDocument.childNamed(TfsCatalogSoapClient.XmlSoapBody);
        const nodesResponse = soapBody.childNamed(TfsCatalogSoapClient.XmlQueryNodesResponse);
        const nodesResult = nodesResponse.childNamed(TfsCatalogSoapClient.XmlQueryNodesResult);
        const catalogResources = nodesResult.childNamed(TfsCatalogSoapClient.XmlCatalogResources);
        if (!catalogResources) {
            throw new Error(`No CatalogResources were received for OrganizationRoot from ${this.endpointUrl}`);
        }
        //Spin through children doing insensitive check
        let orgRoot;
        for (let idx = 0; idx < catalogResources.children.length; idx++) {
            if (catalogResources.children[idx].attr.ResourceTypeIdentifier.toLowerCase() === TfsCatalogSoapClient.OrganizationalRoot) {
                orgRoot = catalogResources.children[idx];
                break;
            }
        }
        if (!orgRoot) {
            throw new Error(`No organizationRoot was found in SOAP envelope from ${this.endpointUrl}`);
        }
        const nodeRefPaths = orgRoot.childNamed(TfsCatalogSoapClient.XmlNodeReferencesPaths);
        const nodeRefPath = nodeRefPaths.children[0].val;
        return nodeRefPath;
    }
    /*
        Sample value of the parameter sent to this function:

        <?xml version="1.0" encoding="UTF-8"?>
        <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
        <soap:Body>
            <QueryNodesResponse xmlns="http://microsoft.com/webservices/">
                <QueryNodesResult>
                    <CatalogResourceTypes>
                    <CatalogResourceType Identifier="b36f1bda-df2d-482b-993a-f194a31a1fa2" DisplayName="Team Foundation Server Instance">
                        <Description>A deployed instance of Team Foundation Server.</Description>
                    </CatalogResourceType>
                    <CatalogResourceType Identifier="ffaf34bb-aded-4507-9e52-fca85e91ba63" DisplayName="Team Foundation Server Web Application">
                        <Description>The web application that hosts a Team Foundation Server</Description>
                    </CatalogResourceType>
                    </CatalogResourceTypes>
                    <CatalogResources>
                    <CatalogResource Identifier="0cc8419b-da0f-4b0a-a816-c00d11d83558" DisplayName="Team Foundation Server Instance" ResourceTypeIdentifier="b36f1bda-df2d-482b-993a-f194a31a1fa2" TempCorrelationId="0cc8419b-da0f-4b0a-a816-c00d11d83558" ctype="0" MatchedQuery="true">
                        <CatalogServiceReferences>
                            <CatalogServiceReference ResourceIdentifier="0cc8419b-da0f-4b0a-a816-c00d11d83558" AssociationKey="Location">
                                <ServiceDefinition serviceType="LocationService" identifier="bf9cf1d0-24ac-4d35-aeca-6cd18c69c1fe" displayName="Location Service" relativeToSetting="0" relativePath="/TeamFoundation/Administration/v3.0/LocationService.asmx" description="Location Service for Visual Studio Team Foundation Server." toolId="Framework">
                                <RelativeToSetting>Context</RelativeToSetting>
                                <ServiceOwner>00000000-0000-0000-0000-000000000000</ServiceOwner>
                                <LocationMappings />
                                <ParentIdentifier>00000000-0000-0000-0000-000000000000</ParentIdentifier>
                                <InheritLevel>None</InheritLevel>
                                </ServiceDefinition>
                            </CatalogServiceReference>
                        </CatalogServiceReferences>
                        <Properties />
                        <NodeReferencePaths>
                            <string>3eYRYkJOok6GHrKam0AcAA==GJQSi7i010yMVKSDvyLgHQ==</string>
                        </NodeReferencePaths>
                    </CatalogResource>
                    <CatalogResource Identifier="0640fed7-84f8-45c5-b9bf-062045cae5c8" DisplayName="Team Foundation Server Web Application" ResourceTypeIdentifier="ffaf34bb-aded-4507-9e52-fca85e91ba63" TempCorrelationId="0640fed7-84f8-45c5-b9bf-062045cae5c8" ctype="0" MatchedQuery="false">
                        <CatalogServiceReferences />
                        <Properties />
                        <NodeReferencePaths>
                            <string>Vc1S6XwnTEe/isOiPfhmxw==TKuP+6nWJkWp5U9GA3ovcA==Dw5+eHh8ykK/e8nLXC8QyA==</string>
                        </NodeReferencePaths>
                    </CatalogResource>
                    </CatalogResources>
                    <CatalogNodes>
                    <CatalogNode FullPath="3eYRYkJOok6GHrKam0AcAA==GJQSi7i010yMVKSDvyLgHQ==" default="false" ResourceIdentifier="0cc8419b-da0f-4b0a-a816-c00d11d83558" ParentPath="3eYRYkJOok6GHrKam0AcAA==" ChildItem="GJQSi7i010yMVKSDvyLgHQ==" NodeDependenciesIncluded="true" ctype="0" MatchedQuery="true">
                        <NodeDependencies>
                            <CatalogNodeDependency FullPath="3eYRYkJOok6GHrKam0AcAA==GJQSi7i010yMVKSDvyLgHQ==" AssociationKey="WebApplication" RequiredNodeFullPath="Vc1S6XwnTEe/isOiPfhmxw==TKuP+6nWJkWp5U9GA3ovcA==Dw5+eHh8ykK/e8nLXC8QyA==" IsSingleton="false" />
                            <CatalogNodeDependency FullPath="3eYRYkJOok6GHrKam0AcAA==GJQSi7i010yMVKSDvyLgHQ==" AssociationKey="WebApplication" RequiredNodeFullPath="Vc1S6XwnTEe/isOiPfhmxw==TKuP+6nWJkWp5U9GA3ovcA==Dw5+eHh8ykK/e8nLXC8QyA==" IsSingleton="false" />
                        </NodeDependencies>
                    </CatalogNode>
                    <CatalogNode FullPath="Vc1S6XwnTEe/isOiPfhmxw==TKuP+6nWJkWp5U9GA3ovcA==Dw5+eHh8ykK/e8nLXC8QyA==" default="false" ResourceIdentifier="0640fed7-84f8-45c5-b9bf-062045cae5c8" ParentPath="Vc1S6XwnTEe/isOiPfhmxw==TKuP+6nWJkWp5U9GA3ovcA==" ChildItem="Dw5+eHh8ykK/e8nLXC8QyA==" NodeDependenciesIncluded="true" ctype="0" MatchedQuery="false">
                        <NodeDependencies />
                    </CatalogNode>
                    </CatalogNodes>
                    <DeletedResources />
                    <DeletedNodeResources />
                    <DeletedNodes />
                    <LocationServiceLastChangeId>4006</LocationServiceLastChangeId>
                </QueryNodesResult>
            </QueryNodesResponse>
        </soap:Body>
        </soap:Envelope>
    */
    parseFoundationServerRootPath(envelopeXml) {
        if (!envelopeXml) {
            throw new Error(`No SOAP envelope was received for FoundationServer from ${this.endpointUrl}`);
        }
        const foundationServerDocument = new xmldoc.XmlDocument(envelopeXml);
        const soapBody = foundationServerDocument.childNamed(TfsCatalogSoapClient.XmlSoapBody);
        const nodesResponse = soapBody.childNamed(TfsCatalogSoapClient.XmlQueryNodesResponse);
        const nodesResult = nodesResponse.childNamed(TfsCatalogSoapClient.XmlQueryNodesResult);
        const catalogResources = nodesResult.childNamed(TfsCatalogSoapClient.XmlCatalogResources);
        if (!catalogResources) {
            throw new Error(`No CatalogResources were received for FoundationServer from ${this.endpointUrl}`);
        }
        let serverInstance;
        //Spin through children doing insensitive check
        for (let idx = 0; idx < catalogResources.children.length; idx++) {
            if (catalogResources.children[idx].attr.ResourceTypeIdentifier.toLowerCase() === TfsCatalogSoapClient.TeamFoundationServerInstance) {
                serverInstance = catalogResources.children[idx];
                break;
            }
        }
        if (!serverInstance) {
            throw new Error(`No serverInstance was found in SOAP envelope from ${this.endpointUrl}`);
        }
        const nodeRefPaths = serverInstance.childNamed(TfsCatalogSoapClient.XmlNodeReferencesPaths);
        const nodeRefPath = nodeRefPaths.children[0].val;
        return nodeRefPath;
    }
    /*
        Sample value of the parameter sent to this function:

        <?xml version="1.0" encoding="UTF-8"?>
        <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
        <soap:Body>
            <QueryNodesResponse xmlns="http://microsoft.com/webservices/">
                <QueryNodesResult>
                    <CatalogResourceTypes>
                    <CatalogResourceType Identifier="47fa57a4-8157-4fb5-9a64-a7a4954bd284" DisplayName="Team Web Access">
                        <Description>Team Web Access Location</Description>
                    </CatalogResourceType>
                    <CatalogResourceType Identifier="26338d9e-d437-44aa-91f2-55880a328b54" DisplayName="Team Project Collection">
                        <Description>A Team Project Collection that exists within the TFS deployment.</Description>
                    </CatalogResourceType>
                    </CatalogResourceTypes>
                    <CatalogResources>
                    <CatalogResource Identifier="f1a834e9-15e6-4c2e-916e-1e536b8666b0" DisplayName="Team Web Access" ResourceTypeIdentifier="47fa57a4-8157-4fb5-9a64-a7a4954bd284" TempCorrelationId="f1a834e9-15e6-4c2e-916e-1e536b8666b0" ctype="0" MatchedQuery="true">
                        <CatalogServiceReferences>
                            <CatalogServiceReference ResourceIdentifier="f1a834e9-15e6-4c2e-916e-1e536b8666b0" AssociationKey="Annotate">
                                <ServiceDefinition serviceType="Annotate" identifier="74b15e02-0ac2-414f-a9b9-30268659d3b5" displayName="Team Web Access (Annotate)" relativeToSetting="0" relativePath="/web/ann.aspx" toolId="TSWebAccess">
                                <RelativeToSetting>Context</RelativeToSetting>
                                <ServiceOwner>00000000-0000-0000-0000-000000000000</ServiceOwner>
                                <LocationMappings />
                                <ParentIdentifier>00000000-0000-0000-0000-000000000000</ParentIdentifier>
                                <InheritLevel>None</InheritLevel>
                                </ServiceDefinition>
                            </CatalogServiceReference>
                            <CatalogServiceReference ResourceIdentifier="f1a834e9-15e6-4c2e-916e-1e536b8666b0" AssociationKey="AnnotateSourceControlItem">
                                <ServiceDefinition serviceType="AnnotateSourceControlItem" identifier="d271e722-c261-4bc2-b0f7-1c8a9e13f907" displayName="Team Web Access (AnnotateSourceControlItem)" relativeToSetting="0" relativePath="/web/ann.aspx?pcguid={projectCollectionGuid}&amp;path={itemPath}&amp;cs={itemChangeset}" toolId="TSWebAccess">
                                <RelativeToSetting>Context</RelativeToSetting>
                                <ServiceOwner>00000000-0000-0000-0000-000000000000</ServiceOwner>
                                <LocationMappings />
                                <ParentIdentifier>00000000-0000-0000-0000-000000000000</ParentIdentifier>
                                <InheritLevel>None</InheritLevel>
                                </ServiceDefinition>
                            </CatalogServiceReference>
                            <CatalogServiceReference ResourceIdentifier="f1a834e9-15e6-4c2e-916e-1e536b8666b0" AssociationKey="ChangesetDetail">
                                <ServiceDefinition serviceType="ChangesetDetail" identifier="d40ef625-cca7-4e73-b9ec-86cbe1534ce0" displayName="Team Web Access (ChangesetDetail)" relativeToSetting="0" relativePath="/web/cs.aspx" toolId="TSWebAccess">
                                <RelativeToSetting>Context</RelativeToSetting>
                                <ServiceOwner>00000000-0000-0000-0000-000000000000</ServiceOwner>
                                <LocationMappings />
                                <ParentIdentifier>00000000-0000-0000-0000-000000000000</ParentIdentifier>
                                <InheritLevel>None</InheritLevel>
                                </ServiceDefinition>
                            </CatalogServiceReference>
                            <CatalogServiceReference ResourceIdentifier="f1a834e9-15e6-4c2e-916e-1e536b8666b0" AssociationKey="CreateWorkItem">
                                <ServiceDefinition serviceType="CreateWorkItem" identifier="14cd69c6-88f9-4c8c-a259-d2441d77d1af" displayName="Team Web Access (CreateWorkItem)" relativeToSetting="0" relativePath="/web/wi.aspx?puri={projectUri}&amp;wit={workItemType}" toolId="TSWebAccess">
                                <RelativeToSetting>Context</RelativeToSetting>
                                <ServiceOwner>00000000-0000-0000-0000-000000000000</ServiceOwner>
                                <LocationMappings />
                                <ParentIdentifier>00000000-0000-0000-0000-000000000000</ParentIdentifier>
                                <InheritLevel>None</InheritLevel>
                                </ServiceDefinition>
                            </CatalogServiceReference>
                            <CatalogServiceReference ResourceIdentifier="f1a834e9-15e6-4c2e-916e-1e536b8666b0" AssociationKey="Difference">
                                <ServiceDefinition serviceType="Difference" identifier="2b84d900-1f08-486c-9c47-0e6af371d03c" displayName="Team Web Access (Difference)" relativeToSetting="0" relativePath="/web/diff.aspx" toolId="TSWebAccess">
                                <RelativeToSetting>Context</RelativeToSetting>
                                <ServiceOwner>00000000-0000-0000-0000-000000000000</ServiceOwner>
                                <LocationMappings />
                                <ParentIdentifier>00000000-0000-0000-0000-000000000000</ParentIdentifier>
                                <InheritLevel>None</InheritLevel>
                                </ServiceDefinition>
                            </CatalogServiceReference>
                            <CatalogServiceReference ResourceIdentifier="f1a834e9-15e6-4c2e-916e-1e536b8666b0" AssociationKey="DiffSourceControlItems">
                                <ServiceDefinition serviceType="DiffSourceControlItems" identifier="5e91c4da-0013-4ebb-943d-cc77f5adb82d" displayName="Team Web Access (DiffSourceControlItems)" relativeToSetting="0" relativePath="/web/diff.aspx?pcguid={projectCollectionGuid}&amp;opath={originalItemPath}&amp;ocs={originalItemChangeset}&amp;mpath={modifiedItemPath}&amp;mcs={modifiedItemChangeset}" toolId="TSWebAccess">
                                <RelativeToSetting>Context</RelativeToSetting>
                                <ServiceOwner>00000000-0000-0000-0000-000000000000</ServiceOwner>
                                <LocationMappings />
                                <ParentIdentifier>00000000-0000-0000-0000-000000000000</ParentIdentifier>
                                <InheritLevel>None</InheritLevel>
                                </ServiceDefinition>
                            </CatalogServiceReference>
                            <CatalogServiceReference ResourceIdentifier="f1a834e9-15e6-4c2e-916e-1e536b8666b0" AssociationKey="DiffSourceControlShelvedItem">
                                <ServiceDefinition serviceType="DiffSourceControlShelvedItem" identifier="57768903-455f-4001-a956-baff869fef83" displayName="Team Web Access (DiffSourceControlShelvedItem)" relativeToSetting="0" relativePath="/web/diff.aspx?pcguid={projectCollectionGuid}&amp;opath={originalItemPath}&amp;ocs={originalItemChangeset}&amp;mpath={shelvedItemPath}&amp;mss={shelvesetName};{shelvesetOwner}" toolId="TSWebAccess">
                                <RelativeToSetting>Context</RelativeToSetting>
                                <ServiceOwner>00000000-0000-0000-0000-000000000000</ServiceOwner>
                                <LocationMappings />
                                <ParentIdentifier>00000000-0000-0000-0000-000000000000</ParentIdentifier>
                                <InheritLevel>None</InheritLevel>
                                </ServiceDefinition>
                            </CatalogServiceReference>
                            <CatalogServiceReference ResourceIdentifier="f1a834e9-15e6-4c2e-916e-1e536b8666b0" AssociationKey="ExploreSourceControlPath">
                                <ServiceDefinition serviceType="ExploreSourceControlPath" identifier="ac0770bc-1dd6-4b8e-a811-5a03690df44f" displayName="Team Web Access (ExploreSourceControlPath)" relativeToSetting="0" relativePath="/web/scc.aspx?pcguid={projectCollectionGuid}&amp;path={sourceControlPath}" toolId="TSWebAccess">
                                <RelativeToSetting>Context</RelativeToSetting>
                                <ServiceOwner>00000000-0000-0000-0000-000000000000</ServiceOwner>
                                <LocationMappings />
                                <ParentIdentifier>00000000-0000-0000-0000-000000000000</ParentIdentifier>
                                <InheritLevel>None</InheritLevel>
                                </ServiceDefinition>
                            </CatalogServiceReference>
                            <CatalogServiceReference ResourceIdentifier="f1a834e9-15e6-4c2e-916e-1e536b8666b0" AssociationKey="Home">
                                <ServiceDefinition serviceType="TSWAHome" identifier="0f9ced5d-89f9-4743-bab8-fa511ff09a8c" displayName="Team Web Access (TSWAHome)" relativeToSetting="0" relativePath="/web" toolId="TSWebAccess">
                                <RelativeToSetting>Context</RelativeToSetting>
                                <ServiceOwner>00000000-0000-0000-0000-000000000000</ServiceOwner>
                                <LocationMappings />
                                <ParentIdentifier>00000000-0000-0000-0000-000000000000</ParentIdentifier>
                                <InheritLevel>None</InheritLevel>
                                </ServiceDefinition>
                            </CatalogServiceReference>
                            <CatalogServiceReference ResourceIdentifier="f1a834e9-15e6-4c2e-916e-1e536b8666b0" AssociationKey="OpenWorkItem">
                                <ServiceDefinition serviceType="OpenWorkItem" identifier="85a61ff8-0af0-44f1-8d9a-2fabd351a26a" displayName="Team Web Access (OpenWorkItem)" relativeToSetting="0" relativePath="/web/wi.aspx?pcguid={projectCollectionGuid}&amp;id={workItemId}" toolId="TSWebAccess">
                                <RelativeToSetting>Context</RelativeToSetting>
                                <ServiceOwner>00000000-0000-0000-0000-000000000000</ServiceOwner>
                                <LocationMappings />
                                <ParentIdentifier>00000000-0000-0000-0000-000000000000</ParentIdentifier>
                                <InheritLevel>None</InheritLevel>
                                </ServiceDefinition>
                            </CatalogServiceReference>
                            <CatalogServiceReference ResourceIdentifier="f1a834e9-15e6-4c2e-916e-1e536b8666b0" AssociationKey="QueryResults">
                                <ServiceDefinition serviceType="QueryResults" identifier="42acdf9b-f814-4e10-abaa-0f7b5d5df45f" displayName="Team Web Access (QueryResults)" relativeToSetting="0" relativePath="/web/qr.aspx" toolId="TSWebAccess">
                                <RelativeToSetting>Context</RelativeToSetting>
                                <ServiceOwner>00000000-0000-0000-0000-000000000000</ServiceOwner>
                                <LocationMappings />
                                <ParentIdentifier>00000000-0000-0000-0000-000000000000</ParentIdentifier>
                                <InheritLevel>None</InheritLevel>
                                </ServiceDefinition>
                            </CatalogServiceReference>
                            <CatalogServiceReference ResourceIdentifier="f1a834e9-15e6-4c2e-916e-1e536b8666b0" AssociationKey="ShelvesetDetail">
                                <ServiceDefinition serviceType="ShelvesetDetail" identifier="b5c6e965-ca8d-4dc6-a6fc-f25af0c71d19" displayName="Team Web Access (ShelvesetDetail)" relativeToSetting="0" relativePath="/web/ss.aspx" toolId="TSWebAccess">
                                <RelativeToSetting>Context</RelativeToSetting>
                                <ServiceOwner>00000000-0000-0000-0000-000000000000</ServiceOwner>
                                <LocationMappings />
                                <ParentIdentifier>00000000-0000-0000-0000-000000000000</ParentIdentifier>
                                <InheritLevel>None</InheritLevel>
                                </ServiceDefinition>
                            </CatalogServiceReference>
                            <CatalogServiceReference ResourceIdentifier="f1a834e9-15e6-4c2e-916e-1e536b8666b0" AssociationKey="SourceExplorer">
                                <ServiceDefinition serviceType="SourceExplorer" identifier="56b61720-a7e1-4962-af6c-a1484bdfa92c" displayName="Team Web Access (SourceExplorer)" relativeToSetting="0" relativePath="/web/scc.aspx" toolId="TSWebAccess">
                                <RelativeToSetting>Context</RelativeToSetting>
                                <ServiceOwner>00000000-0000-0000-0000-000000000000</ServiceOwner>
                                <LocationMappings />
                                <ParentIdentifier>00000000-0000-0000-0000-000000000000</ParentIdentifier>
                                <InheritLevel>None</InheritLevel>
                                </ServiceDefinition>
                            </CatalogServiceReference>
                            <CatalogServiceReference ResourceIdentifier="f1a834e9-15e6-4c2e-916e-1e536b8666b0" AssociationKey="ViewBuildDetails">
                                <ServiceDefinition serviceType="ViewBuildDetails" identifier="3a90493b-068d-4f1e-ad35-6f43c967a0d8" displayName="Team Web Access (ViewBuildDetails)" relativeToSetting="0" relativePath="/web/build.aspx?pcguid={projectCollectionGuid}&amp;builduri={buildUri}" toolId="TSWebAccess">
                                <RelativeToSetting>Context</RelativeToSetting>
                                <ServiceOwner>00000000-0000-0000-0000-000000000000</ServiceOwner>
                                <LocationMappings />
                                <ParentIdentifier>00000000-0000-0000-0000-000000000000</ParentIdentifier>
                                <InheritLevel>None</InheritLevel>
                                </ServiceDefinition>
                            </CatalogServiceReference>
                            <CatalogServiceReference ResourceIdentifier="f1a834e9-15e6-4c2e-916e-1e536b8666b0" AssociationKey="ViewChangesetDetails">
                                <ServiceDefinition serviceType="ViewChangesetDetails" identifier="91f567e1-087b-4ded-ad2b-54099a60fdae" displayName="Team Web Access (ViewChangesetDetails)" relativeToSetting="0" relativePath="/web/cs.aspx?pcguid={projectCollectionGuid}&amp;cs={changesetId}" toolId="TSWebAccess">
                                <RelativeToSetting>Context</RelativeToSetting>
                                <ServiceOwner>00000000-0000-0000-0000-000000000000</ServiceOwner>
                                <LocationMappings />
                                <ParentIdentifier>00000000-0000-0000-0000-000000000000</ParentIdentifier>
                                <InheritLevel>None</InheritLevel>
                                </ServiceDefinition>
                            </CatalogServiceReference>
                            <CatalogServiceReference ResourceIdentifier="f1a834e9-15e6-4c2e-916e-1e536b8666b0" AssociationKey="ViewItem">
                                <ServiceDefinition serviceType="ViewItem" identifier="3b2cea6d-c926-46c5-8660-e0d265705be0" displayName="Team Web Access (ViewItem)" relativeToSetting="0" relativePath="/web/view.aspx" toolId="TSWebAccess">
                                <RelativeToSetting>Context</RelativeToSetting>
                                <ServiceOwner>00000000-0000-0000-0000-000000000000</ServiceOwner>
                                <LocationMappings />
                                <ParentIdentifier>00000000-0000-0000-0000-000000000000</ParentIdentifier>
                                <InheritLevel>None</InheritLevel>
                                </ServiceDefinition>
                            </CatalogServiceReference>
                            <CatalogServiceReference ResourceIdentifier="f1a834e9-15e6-4c2e-916e-1e536b8666b0" AssociationKey="ViewServerQueryResults">
                                <ServiceDefinition serviceType="ViewServerQueryResults" identifier="062ad1b2-b1e6-4f72-ba32-391b5f5474e4" displayName="Team Web Access (ViewServerQueryResults)" relativeToSetting="0" relativePath="/web/qr.aspx?puri={projectUri}&amp;path={storedQueryPath}" toolId="TSWebAccess">
                                <RelativeToSetting>Context</RelativeToSetting>
                                <ServiceOwner>00000000-0000-0000-0000-000000000000</ServiceOwner>
                                <LocationMappings />
                                <ParentIdentifier>00000000-0000-0000-0000-000000000000</ParentIdentifier>
                                <InheritLevel>None</InheritLevel>
                                </ServiceDefinition>
                            </CatalogServiceReference>
                            <CatalogServiceReference ResourceIdentifier="f1a834e9-15e6-4c2e-916e-1e536b8666b0" AssociationKey="ViewShelvesetDetails">
                                <ServiceDefinition serviceType="ViewShelvesetDetails" identifier="5f9a6d4f-766e-4a70-9ddf-bfde6c90741e" displayName="Team Web Access (ViewShelvesetDetails)" relativeToSetting="0" relativePath="/web/ss.aspx?pcguid={projectCollectionGuid}&amp;ssname={shelvesetName}&amp;ssowner={shelvesetOwner}" toolId="TSWebAccess">
                                <RelativeToSetting>Context</RelativeToSetting>
                                <ServiceOwner>00000000-0000-0000-0000-000000000000</ServiceOwner>
                                <LocationMappings />
                                <ParentIdentifier>00000000-0000-0000-0000-000000000000</ParentIdentifier>
                                <InheritLevel>None</InheritLevel>
                                </ServiceDefinition>
                            </CatalogServiceReference>
                            <CatalogServiceReference ResourceIdentifier="f1a834e9-15e6-4c2e-916e-1e536b8666b0" AssociationKey="ViewSourceControlItem">
                                <ServiceDefinition serviceType="ViewSourceControlItem" identifier="0fdc7b8f-0294-43ec-a98f-ca65213914da" displayName="Team Web Access (ViewSourceControlItem)" relativeToSetting="0" relativePath="/web/view.aspx?pcguid={projectCollectionGuid}&amp;path={itemPath}&amp;cs={itemChangeset}" toolId="TSWebAccess">
                                <RelativeToSetting>Context</RelativeToSetting>
                                <ServiceOwner>00000000-0000-0000-0000-000000000000</ServiceOwner>
                                <LocationMappings />
                                <ParentIdentifier>00000000-0000-0000-0000-000000000000</ParentIdentifier>
                                <InheritLevel>None</InheritLevel>
                                </ServiceDefinition>
                            </CatalogServiceReference>
                            <CatalogServiceReference ResourceIdentifier="f1a834e9-15e6-4c2e-916e-1e536b8666b0" AssociationKey="ViewSourceControlItemHistory">
                                <ServiceDefinition serviceType="ViewSourceControlItemHistory" identifier="ee15e514-d6c7-4aac-96f4-7c334c9459fc" displayName="Team Web Access (ViewSourceControlItemHistory)" relativeToSetting="0" relativePath="/web/history.aspx?pcguid={projectCollectionGuid}&amp;path={itemPath}&amp;cs={itemChangeset}" toolId="TSWebAccess">
                                <RelativeToSetting>Context</RelativeToSetting>
                                <ServiceOwner>00000000-0000-0000-0000-000000000000</ServiceOwner>
                                <LocationMappings />
                                <ParentIdentifier>00000000-0000-0000-0000-000000000000</ParentIdentifier>
                                <InheritLevel>None</InheritLevel>
                                </ServiceDefinition>
                            </CatalogServiceReference>
                            <CatalogServiceReference ResourceIdentifier="f1a834e9-15e6-4c2e-916e-1e536b8666b0" AssociationKey="ViewSourceControlShelvedItem">
                                <ServiceDefinition serviceType="ViewSourceControlShelvedItem" identifier="4c81a44d-67ab-4d23-9cbe-339c9102993b" displayName="Team Web Access (ViewSourceControlShelvedItem)" relativeToSetting="0" relativePath="/web/view.aspx?pcguid={projectCollectionGuid}&amp;path={itemPath}&amp;ss={shelvesetName};{shelvesetOwner}" toolId="TSWebAccess">
                                <RelativeToSetting>Context</RelativeToSetting>
                                <ServiceOwner>00000000-0000-0000-0000-000000000000</ServiceOwner>
                                <LocationMappings />
                                <ParentIdentifier>00000000-0000-0000-0000-000000000000</ParentIdentifier>
                                <InheritLevel>None</InheritLevel>
                                </ServiceDefinition>
                            </CatalogServiceReference>
                            <CatalogServiceReference ResourceIdentifier="f1a834e9-15e6-4c2e-916e-1e536b8666b0" AssociationKey="ViewWiqlQueryResults">
                                <ServiceDefinition serviceType="ViewWiqlQueryResults" identifier="0f9ced5d-89f9-4743-bab8-fa511ff09a8c" displayName="Team Web Access (ViewWiqlQueryResults)" relativeToSetting="0" relativePath="/web/qr.aspx?puri={projectUri}&amp;wiql={queryText}&amp;name={queryDisplayName}" toolId="TSWebAccess">
                                <RelativeToSetting>Context</RelativeToSetting>
                                <ServiceOwner>00000000-0000-0000-0000-000000000000</ServiceOwner>
                                <LocationMappings />
                                <ParentIdentifier>00000000-0000-0000-0000-000000000000</ParentIdentifier>
                                <InheritLevel>None</InheritLevel>
                                </ServiceDefinition>
                            </CatalogServiceReference>
                            <CatalogServiceReference ResourceIdentifier="f1a834e9-15e6-4c2e-916e-1e536b8666b0" AssociationKey="WorkItemEditor">
                                <ServiceDefinition serviceType="WorkItemEditor" identifier="7bbe4c9c-268b-4175-8979-a06878149aef" displayName="Team Web Access (WorkItemEditor)" relativeToSetting="0" relativePath="/web/wi.aspx" toolId="TSWebAccess">
                                <RelativeToSetting>Context</RelativeToSetting>
                                <ServiceOwner>00000000-0000-0000-0000-000000000000</ServiceOwner>
                                <LocationMappings />
                                <ParentIdentifier>00000000-0000-0000-0000-000000000000</ParentIdentifier>
                                <InheritLevel>None</InheritLevel>
                                </ServiceDefinition>
                            </CatalogServiceReference>
                        </CatalogServiceReferences>
                        <Properties />
                        <NodeReferencePaths>
                            <string>3eYRYkJOok6GHrKam0AcAA==GJQSi7i010yMVKSDvyLgHQ==5WM1lP72kkiwOcTd6ZWclw==</string>
                        </NodeReferencePaths>
                    </CatalogResource>
                    <CatalogResource Identifier="0910fe90-d0b2-4748-a535-3bbe65f908ec" DisplayName="DefaultCollection" ResourceTypeIdentifier="26338d9e-d437-44aa-91f2-55880a328b54" TempCorrelationId="0910fe90-d0b2-4748-a535-3bbe65f908ec" ctype="0" MatchedQuery="true">
                        <Description />
                        <CatalogServiceReferences>
                            <CatalogServiceReference ResourceIdentifier="0910fe90-d0b2-4748-a535-3bbe65f908ec" AssociationKey="Location">
                                <ServiceDefinition serviceType="LocationService" identifier="4a3d32f1-f8f4-42bc-9fea-57e547e7463d" displayName="Location Service" relativeToSetting="2" relativePath="/DefaultCollection/Services/v3.0/LocationService.asmx" description="Location Service for Visual Studio Team Foundation Server." toolId="Framework">
                                <RelativeToSetting>WebApplication</RelativeToSetting>
                                <ServiceOwner>00000000-0000-0000-0000-000000000000</ServiceOwner>
                                <LocationMappings />
                                <ParentIdentifier>00000000-0000-0000-0000-000000000000</ParentIdentifier>
                                <InheritLevel>None</InheritLevel>
                                </ServiceDefinition>
                            </CatalogServiceReference>
                        </CatalogServiceReferences>
                        <Properties>
                            <KeyValueOfStringString>
                                <Key>InstanceId</Key>
                                <Value>4a3d32f1-f8f4-42bc-9fea-57e547e7463d</Value>
                            </KeyValueOfStringString>
                        </Properties>
                        <NodeReferencePaths>
                            <string>3eYRYkJOok6GHrKam0AcAA==GJQSi7i010yMVKSDvyLgHQ==pH3F9yLMlUOsZc43M2a04A==</string>
                        </NodeReferencePaths>
                    </CatalogResource>
                    </CatalogResources>
                    <CatalogNodes>
                    <CatalogNode FullPath="3eYRYkJOok6GHrKam0AcAA==GJQSi7i010yMVKSDvyLgHQ==5WM1lP72kkiwOcTd6ZWclw==" default="false" ResourceIdentifier="f1a834e9-15e6-4c2e-916e-1e536b8666b0" ParentPath="3eYRYkJOok6GHrKam0AcAA==GJQSi7i010yMVKSDvyLgHQ==" ChildItem="5WM1lP72kkiwOcTd6ZWclw==" NodeDependenciesIncluded="true" ctype="0" MatchedQuery="true">
                        <NodeDependencies />
                    </CatalogNode>
                    <CatalogNode FullPath="3eYRYkJOok6GHrKam0AcAA==GJQSi7i010yMVKSDvyLgHQ==pH3F9yLMlUOsZc43M2a04A==" default="false" ResourceIdentifier="0910fe90-d0b2-4748-a535-3bbe65f908ec" ParentPath="3eYRYkJOok6GHrKam0AcAA==GJQSi7i010yMVKSDvyLgHQ==" ChildItem="pH3F9yLMlUOsZc43M2a04A==" NodeDependenciesIncluded="true" ctype="0" MatchedQuery="true">
                        <NodeDependencies />
                    </CatalogNode>
                    </CatalogNodes>
                    <DeletedResources />
                    <DeletedNodeResources />
                    <DeletedNodes />
                    <LocationServiceLastChangeId>4006</LocationServiceLastChangeId>
                </QueryNodesResult>
            </QueryNodesResponse>
        </soap:Body>
        </soap:Envelope>
    */
    parseProjectCollections(envelopeXml) {
        if (!envelopeXml) {
            throw new Error(`No SOAP envelope was received for ProjectCollections from ${this.endpointUrl}`);
        }
        const projectCollectionsDocument = new xmldoc.XmlDocument(envelopeXml);
        const soapBody = projectCollectionsDocument.childNamed(TfsCatalogSoapClient.XmlSoapBody);
        const nodesResponse = soapBody.childNamed(TfsCatalogSoapClient.XmlQueryNodesResponse);
        const nodesResult = nodesResponse.childNamed(TfsCatalogSoapClient.XmlQueryNodesResult);
        const catalogResources = nodesResult.childNamed(TfsCatalogSoapClient.XmlCatalogResources);
        if (!catalogResources) {
            throw new Error(`No CatalogResources were received for ProjectCollections from ${this.endpointUrl}`);
        }
        const collectionNodes = [];
        catalogResources.eachChild(function (catalogResource) {
            if (catalogResource.attr.ResourceTypeIdentifier.toLowerCase() === TfsCatalogSoapClient.ProjectCollection) {
                collectionNodes.push(catalogResource);
            }
        });
        return collectionNodes;
    }
    // Based on the passed in collectionName, it queries the TFS Catalog Service to find
    // the collection's display name, id (guid), and API URL (_apis/projectCollections/)
    // This method returns 'any' (of the _shape_ TeamProjectCollectionReference) which will
    // match "good enough" to the type expected in repositoryinfoclient.
    GetProjectCollection(collectionName) {
        const deferred = Q.defer();
        //Get the organizational root
        this.getCatalogDataFromServer(TfsCatalogSoapClient.SingleRecurseStar, TfsCatalogSoapClient.QueryOptionsNone).then((catalogDataXml) => {
            const orgRootPath = this.parseOrganizationRootPath(catalogDataXml);
            //Get the foundationServer, orgRootPath looks something like 3eYRYkJOok6GHrKam0AcAA==
            this.getCatalogDataFromServer(orgRootPath + TfsCatalogSoapClient.SingleRecurseStar, TfsCatalogSoapClient.QueryOptionsExpandDependencies).then((catalogDataXml) => {
                const foundationServerRootPath = this.parseFoundationServerRootPath(catalogDataXml);
                //Get the project collections, foundationServerRootPath looks something like 3eYRYkJOok6GHrKam0AcAA==GJQSi7i010yMVKSDvyLgHQ==
                this.getCatalogDataFromServer(foundationServerRootPath + TfsCatalogSoapClient.SingleRecurseStar, TfsCatalogSoapClient.QueryOptionsExpandDependencies).then((catalogDataXml) => {
                    const collectionNodes = this.parseProjectCollections(catalogDataXml);
                    //Now go and find the project collection we're looking for
                    let foundTeamProject;
                    for (let idx = 0; idx < collectionNodes.length; idx++) {
                        if (collectionNodes[idx].attr.DisplayName.toLowerCase() === collectionName.toLowerCase()) {
                            foundTeamProject = collectionNodes[idx];
                            break;
                        }
                    }
                    if (foundTeamProject) {
                        const props = foundTeamProject.childNamed("Properties");
                        const strstr = props.childNamed("KeyValueOfStringString");
                        const id = strstr.childNamed("Value");
                        //Resolve an object that +looks_ like a TeamProjectCollectionReference object
                        deferred.resolve({ name: foundTeamProject.attr.DisplayName, id: id.val, url: url.resolve(this.serverUrl, "_apis/projectCollections/" + id.val) });
                    }
                    else {
                        deferred.resolve(undefined);
                    }
                });
            });
        }).fail((err) => {
            //Apparently, we will fail if auth fails when getting organizational root
            deferred.reject(err);
        });
        return deferred.promise;
    }
    getCatalogDataFromServer(pathSpecs, queryOptions) {
        const deferred = Q.defer();
        const onResult = (err, statusCode, responseEnvelope) => {
            if (err) {
                err.statusCode = statusCode;
                deferred.reject(err);
            }
            else {
                deferred.resolve(responseEnvelope);
            }
        };
        const envelope = "<?xml version='1.0' encoding='UTF-8'?>"
            + "<soap:Envelope xmlns:soap=\"http://www.w3.org/2003/05/soap-envelope\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" "
            + "xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\">"
            + "<soap:Body xmlns=\"http://microsoft.com/webservices/\">"
            + "<QueryNodes>"
            + "<pathSpecs>"
            + "<string>" + pathSpecs + "</string>"
            + "</pathSpecs>"
            + "<queryOptions>" + queryOptions + "</queryOptions>"
            + "</QueryNodes>"
            + "</soap:Body>"
            + "</soap:Envelope>";
        this.soapClient.post(this.endpointUrl, envelope, onResult);
        return deferred.promise;
    }
}
/* tslint:disable:variable-name */
TfsCatalogSoapClient.SingleRecurseStar = "*";
TfsCatalogSoapClient.QueryOptionsNone = "0";
TfsCatalogSoapClient.QueryOptionsExpandDependencies = "1";
// These guids brought over from our friends at vso-intellij...
// https://github.com/Microsoft/vso-intellij/blob/master/plugin/src/com/microsoft/alm/plugin/context/soap/CatalogServiceImpl.java#L56-L58
// Ensure that they rename lower-case
TfsCatalogSoapClient.OrganizationalRoot = "69a51c5e-c093-447e-a177-a09e47a60974";
TfsCatalogSoapClient.TeamFoundationServerInstance = "b36f1bda-df2d-482b-993a-f194a31a1fa2";
TfsCatalogSoapClient.ProjectCollection = "26338d9e-d437-44aa-91f2-55880a328b54";
// Xml nodes in SOAP envelopes are case-sensitive (so don't change the values below)
TfsCatalogSoapClient.XmlSoapBody = "soap:Body";
TfsCatalogSoapClient.XmlQueryNodesResponse = "QueryNodesResponse";
TfsCatalogSoapClient.XmlQueryNodesResult = "QueryNodesResult";
TfsCatalogSoapClient.XmlCatalogResources = "CatalogResources";
TfsCatalogSoapClient.XmlNodeReferencesPaths = "NodeReferencePaths";
exports.TfsCatalogSoapClient = TfsCatalogSoapClient;

//# sourceMappingURL=tfscatalogsoapclient.js.map
