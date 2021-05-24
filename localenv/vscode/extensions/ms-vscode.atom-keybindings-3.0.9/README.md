# Atom Keymap for VS Code

This extension ports popular Atom keyboard shortcuts to Visual Studio Code. After installing the extension and restarting VS Code your favorite keyboard shortcuts from Atom are now available. 

## Changes Introduced in Version 3.0

- Multi cursor editing changed from <kbd>alt</kbd> + click to <kbd>ctrl</kbd> (or <kbd>cmd</kbd>) + click. 
- Enable format on paste. 

All of these features make VS Code more "Atom like." The changes to your User Settings file are as followed. 

```javascript
// Controls whether the prompt will show
"atomKeymap.promptV3Features": true,

// Changes the multi cursor mouse binding
"editor.multiCursorModifier": "ctrlCmd",

// Controls whether format on paste is on or off
"editor.formatOnPaste": true
```

>**Tip:** If you want to see the prompt again simply change `atomKeymap.promptV3Features` to `false` and restart VS Code. 

## Why don't some Atom commands work? 

This is because VS Code has not implemented those features. Head on over to this [GitHub issue](https://github.com/microsoft/vscode/issues/14316) and let the VS Code team know what you'd like to see. 

Additionally, you can install an extension for many of these features:

* [FontSize Shortcuts](https://marketplace.visualstudio.com/items?itemName=peterjuras.fontsize-shortcuts)
* [change case](https://marketplace.visualstudio.com/items?itemName=wmaurer.change-case)
* [transpose](https://marketplace.visualstudio.com/items?itemName=v4run.transpose)

## How do I contribute a keyboard shortcut?

We may have missed a keyboard shortcut. If we did please help us out! It is very easy to make a PR. 

1. Head over to our [GitHub repository](https://github.com/waderyan/vscode-atom-keybindings). 
2. Open [`package.json`](https://github.com/waderyan/vscode-atom-keybindings/blob/master/package.json). 
3. Add a JSON object to [`contributes.keybindings`](https://github.com/waderyan/vscode-atom-keybindings/blob/master/package.json#L25) as seen below. 
4. Open a pull request. 

```json
{
    "mac": "<keyboard shortcut for mac>",
    "linux": "<keyboard shortcut for linux>",
    "win": "<keyboard shortcut for windows>",
    "key": "<default keyboard shortcut>",
    "command": "<name of the command in VS Code>"
}
```

You can read more about how to contribute keybindings in extensions in the [official documentation](http://code.visualstudio.com/docs/extensionAPI/extension-points#_contributeskeybindings). 

## What keyboard shortcuts are included?

| Command | macOS | Windows | Linux |
| :------ | :---- | :------ | :---- |
| `cursorLeftSelect` | `ctrl+shift+b` | `ctrl+shift+b` | `ctrl+shift+b` |
| `cursorRightSelect` | `ctrl+shift+f` | `ctrl+shift+f` | `ctrl+shift+f` |
| `cursorUpSelect` | `ctrl+shift+p` | `ctrl+shift+p` | `ctrl+shift+p` |
| `cursorDownSelect` | `ctrl+shift+n` | `ctrl+shift+n` | `ctrl+shift+n` |
| `cursorWordEndRight` | `alt+f` | `alt+f` | `alt+f` |
| `cursorWordStartLeft` | `alt+b` | `alt+b` | `alt+b` |
| `cursorWordEndRightSelect` | `shift+alt+f` | `shift+alt+f` | `shift+alt+f` |
| `cursorWordStartLeftSelect` | `shift+alt+b` | `shift+alt+b` | `shift+alt+b` |
| `cursorEndSelect` | `ctrl+shift+e` | `ctrl+shift+e` | `ctrl+shift+e` |
| `cursorHomeSelect` | `ctrl+shift+a` | `ctrl+shift+a` | `ctrl+shift+a` |
| `cursorColumnSelectUp` | `ctrl+shift+up` | `undefined` | `shift+alt+up` |
| `cursorColumnSelectDown` | `ctrl+shift+down` | `undefined` | `shift+alt+down` |
| `editor.action.joinLines` | `cmd+j` | `ctrl+j` | `ctrl+j` |
| `editor.action.moveLinesDownAction` | `ctrl+cmd+down` | `ctrl+down` | `ctrl+down` |
| `editor.action.moveLinesUpAction` | `ctrl+cmd+up` | `ctrl+up` | `ctrl+up` |
| `editor.action.copyLinesDownAction` | `cmd+shift+d` | `ctrl+shift+d` | `ctrl+shift+d` |
| `editor.action.deleteLines` | `ctrl+shift+k` | `ctrl+shift+k` | `ctrl+shift+k` |
| `editor.action.formatDocument` | `ctrl-alt-b` | `undefined` | `undefined` |
| `editor.action.openLink` | `ctrl+shift+o` | `undefined` | `undefined` |
| `editor.action.jumpToBracket` | `ctrl+m` | `ctrl+m` | `ctrl+m` |
| `editor.action.showSnippets` | `alt+shift+s` | `alt+shift+s` | `alt+shift+s` |
| `editor.action.format` | `ctrl+alt+b` | `alt+shift+f` | `ctrl+shift+i` |
| `editor.fold` | `alt+cmd+[` | `ctrl+alt+/` | `ctrl+alt+/` |
| `editor.unfold` | `alt+cmd+]` | `ctrl+alt+/` | `ctrl+alt+/` |
| `editor.foldAll` | `alt+shift+cmd+[` | `ctrl+alt+[` | `ctrl+alt+[` |
| `editor.unfoldAll` | `alt+shift+cmd+]` | `ctrl+alt+]` | `ctrl+alt+]` |
| `editor.action.commentLine` | `cmd+shift+7` | `undefined` | `undefined` |
| `editor.unfoldAll` | `alt+shift+cmd+]` | `ctrl+alt+]` | `ctrl+alt+]` |
| `editor.unfoldAll` | `cmd+k cmd-0` | `undefined` | `undefined` |
| `editor.foldLevel1` | `cmd+k cmd+1` | `ctrl+k ctrl+1` | `ctrl+k ctrl+1` |
| `editor.foldLevel2` | `cmd+k cmd+2` | `ctrl+k ctrl+2` | `ctrl+k ctrl+2` |
| `editor.foldLevel3` | `cmd+k cmd+3` | `ctrl+k ctrl+3` | `ctrl+k ctrl+3` |
| `editor.foldLevel4` | `cmd+k cmd+4` | `ctrl+k ctrl+4` | `ctrl+k ctrl+4` |
| `editor.foldLevel5` | `cmd+k cmd+5` | `ctrl+k ctrl+5` | `ctrl+k ctrl+5` |
| `editor.action.selectHighlights` | `ctrl+cmd+g` | `alt+f3` | `alt+f3` |
| `editor.action.insertCursorAtEndOfEachLineSelected` | `cmd+shift+l` | `alt+shift+l` | `alt+shift+l` |
| `expandLineSelection` | `cmd+l` | `ctrl+l` | `ctrl+l` |
| `explorer.newFile` | `a` | `a` | `a` |
| `explorer.newFolder` | `shift+a` | `shift+a` | `shift+a` |
| `explorer.openToSide` | `cmd+1` | `ctrl+1` | `ctrl+1` |
| `filesExplorer.copy` | `cmd+c` | `ctrl+c` | `ctrl+c` |
| `list.collapse` | `h` | `h` | `h` |
| `list.expand` | `l` | `l` | `l` |
| `list.focusDown` | `j` | `j` | `j` |
| `list.focusUp` | `k` | `k` | `k` |
| `moveFileToTrash` | `backspace` | `backspace` | `backspace` |
| `markdown.showPreviewToSide` | `ctrl+shift+m` | `ctrl+shift+m` | `ctrl+shift+m` |
| `redo` | `cmd+y` | `ctrl+y` | `ctrl+y` |
| `workbench.action.toggleZenMode` | `cmd+shift+ctrl+f` | `shift+f11` | `shift+f11` |
| `workbench.action.toggleSidebarVisibility` | `cmd+k cmd+b` | `ctrl+k ctrl+b` | `ctrl+k ctrl+b` |
| `workbench.action.toggleSidebarVisibility` | `cmd+\` | `ctrl+\` | `ctrl+\` |
| `workbench.action.splitEditor` | `cmd+k left` | `ctrl+k left` | `ctrl+k left` |
| `workbench.action.quickOpen` | `cmd+t` | `ctrl+t` | `undefined` |
| `workbench.action.quickOpenNavigateNext` | `cmd+b` | `ctrl+b` | `ctrl+b` |
| `workbench.action.editor.changeLanguageMode` | `ctrl+shift+l` | `ctrl+shift+l` | `ctrl+shift+l` |
| `workbench.action.reloadWindow` | `ctrl+alt+cmd+l` | `alt+ctrl+r` | `alt+ctrl+r` |
| `workbench.action.toggleDevTools` | `alt+cmd+i` | `ctrl+alt+i` | `ctrl+alt+i` |
| `workbench.action.files.openFolder` | `undefined` | `ctrl+shift+o` | `ctrl+shift+o` |
| `workbench.action.files.openFileFolder` | `cmd+shift+o` | `undefined` | `undefined` |
| `workbench.action.terminal.toggleTerminal` | `ctrl+alt+t` | `ctrl+` | `ctrl+` |
| `workbench.action.toggleFullScreen` | `ctrl+cmd+f` | `f11` | `f11` |
| `workbench.action.gotoSymbol` | `cmd+r` | `ctrl+r` | `ctrl+r` |
| `workbench.action.zoomIn` | `cmd+=` | `undefined` | `undefined` |
| `workbench.action.zoomOut` | `cmd+-` | `undefined` | `undefined` |
| `workbench.action.nextEditor` | `undefined` | `ctrl+pagedown` | `ctrl+pagedown` |
| `workbench.action.previousEditor` | `undefined` | `ctrl+pageup` | `ctrl+pageup` |
| `workbench.action.zoomOut` | `cmd+-` | `ctrl+-` | `ctrl+-` |
| `workbench.action.openEditorAtIndex1` | `cmd+1` | `alt+1` | `alt+1` |
| `workbench.action.openEditorAtIndex2` | `cmd+2` | `alt+2` | `alt+2` |
| `workbench.action.openEditorAtIndex3` | `cmd+3` | `alt+3` | `alt+3` |
| `workbench.action.openEditorAtIndex4` | `cmd+4` | `alt+4` | `alt+4` |
| `workbench.action.openEditorAtIndex5` | `cmd+5` | `alt+5` | `alt+5` |
| `workbench.action.openEditorAtIndex6` | `cmd+6` | `alt+6` | `alt+6` |
| `workbench.action.openEditorAtIndex7` | `cmd+7` | `alt+7` | `alt+7` |
| `workbench.action.openEditorAtIndex8` | `cmd+8` | `alt+8` | `alt+8` |
| `workbench.action.openEditorAtIndex9` | `cmd+9` | `alt+9` | `alt+9` |
| `workbench.files.action.showActiveFileInExplorer` | `alt+cmd+\` | `ctrl+shift+\` | `ctrl+shift+\` |
| `workbench.action.files.copyPathOfActiveFile` | `ctrl+shift+c` | `ctrl+shift+c` | `ctrl+shift+c` |
| `workbench.action.openGlobalSettings` | `cmd+,` | `ctrl+,` | `ctrl+,` |
| `workbench.action.showAllEditors` | `cmd+b` | `ctrl+b` | `ctrl+b` |

