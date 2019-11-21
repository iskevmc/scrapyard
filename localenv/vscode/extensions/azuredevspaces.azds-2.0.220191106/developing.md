# VS Code Extension

Running the extension from the dev box
--------------------------------------
1. Open `src\vscode` in VS Code

2. In the terminal window run the following:
    - `npm install` to install dependencies
    - `npm run-script compile`

3. Press F5. This will open a new VS Code window with the extension installed. Then you can open the app you want to debug and press F5 to debug that. The lifetime of the daemon is tied to the VS Code window with the extension. So if you close the window, you will lose the daemon.

Generating the VSIX binaries
----------------------------
To generate the azds-*.vsix file locally use `npm run-script vscode:package`. The vsix file will be generated in `src/vscode`

Debugging the daemon
--------------------
To debug sync scenarios, you can open client code in Visual studio and attach to the daemon process.

The command to run  the daemon is:
- C#: `azds daemon --import azds/azds-vsdbg:15.3@/vsdbg:/vsdbg`
- Java: `azds daemon --import azuredevjava/javadebug:0.1.1@/javadebug:/javadebug`
- Nodejs: `azds daemon`

Test scenarios
--------------
Manual instructions: [../../tests/manual/AZDS-VSCode-Tests.md](../../tests/manual/AZDS-VSCode-Tests.md)

Debug
-----
1. Build the code. Run (current folder):
    * npm install
    * npm run-script compile
2. If you encounter the following error from the above command:
    ** **
        npm ERR! code ELIFECYCLE
        npm ERR! errno 1
        npm ERR! azds@0.1.1 compile: `tsc -p ./ && node ./node_modules/cpx/bin/index.js ./src/template/**/* out/template`
        npm ERR! Exit status 1
    Copy 'src/vscode/src/template' to '/out/template' manually
3. F5

Resources
---------
Documentation for building VS Code extensions: https://code.visualstudio.com/api