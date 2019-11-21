# Azure Dev Spaces for Visual Studio Code
Azure Dev Spaces provides a rapid, iterative Kubernetes development experience for teams in Azure Kubernetes Service (AKS) clusters. Azure Dev Spaces also allows you to debug and test all the components of your application in AKS with minimal dev machine setup and without replicating or mocking up dependencies.

## Featured scenarios

### [Use your public endpoint in the cloud to privately debug backend code running on your dev machine (Preview)](https://aka.ms/devspaces/connect)

This minimizes what you need to set up on your dev machine: the only thing you need to run on your machine is the microservice you're working on and your preferred dev tools. No need to set up mocks or simulators. You don't even need Kubernetes YAML or Docker configuration to do this, and you won't affect the currently deployed app or anyone who's using the AKS cluster.

<img src="https://raw.githubusercontent.com/Azure/dev-spaces/master/assets/connect-graphic-new.gif" alt="Azure Dev Spaces connect model" width="680" />

### [Debug and iterate code directly in AKS](https://aka.ms/azds-quickstart-netcore)

Similar to the first scenario, except this mode enables a higher fidelity development and testing experience by running your code as a container directly in AKS. Dev Spaces can help you generate Docker and Kubernetes assets.

<img src="https://raw.githubusercontent.com/Azure/dev-spaces/master/assets/collaborate-graphic-new.gif" alt="Azure Dev Spaces collaborative model" width="680" />

### [Combine GitHub Actions with Dev Spaces in a pull request review (Preview)](https://aka.ms/devspaces/pr-flow)

Use GitHub Actions to automatically deploy to a new sandbox whenever a pull request is opened so your team can review a live version of the app that includes your pull request changes – all before that code is merged into your main branch! As a bonus, team members such as product managers and designers can become part of the review process during early stages of development.

## Quickstarts

- [Run and debug a microservice](https://aka.ms/azds-quickstart-netcore)
- [Collaborate on a set of microservices with a team](https://aka.ms/azds-quickstart-team)

## How-to guides

- [Use GitHub Actions with Azure Dev Spaces (Preview)](https://aka.ms/devspaces/pr-flow)
- [Connect your development machine to an AKS cluster (Preview)](https://aka.ms/devspaces/connect)

For more information on Azure Dev Spaces, please visit our [documentation page](http://aka.ms/get-azds).

## Data and telemetry
Azure Dev Spaces collects usage data and sends it to Microsoft to help improve our products and services. Read our [privacy statement](https://aka.ms/azds-privacy) to learn more.