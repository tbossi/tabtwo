# TabTwo

*A minimal tab completion library for Node.js*

TabTwo supports tab completion for the following shells:
- bash
- zsh
- fish
- ksh
- powershell

## Installation

TODO

## Usage

TabTwo provides 3 main functionalities:
- Completion installation
- Completion uninstallation
- Completion handling

### Install and uninstall

Tab completion requires installing a file and referring it on your shell profile script.
In order to do so, TabTwo provides two methods for installation and uninstallation.

To install the tab completion:
```js
const tt = new TabTwo('my-program', 'folder-to-store-script')
await tt.install(process.env)
// OR
await tt.install(process.env, async (changingFiles) => {
    // ask user for confirmation before install
    // you can show the list of files that will be created/edited included in `changingFiles` array
    return true // or `false` to abort installation
})
```

To uninstall the tab completion:
```js
const tt = new TabTwo('my-program', 'folder-to-store-script')
await tt.uninstall(process.env)
// OR
await tt.uninstall(process.env, async (changingFiles) => {
    // ask user for confirmation before uninstall
    // you can show the list of files that will be created/deleted included in `changingFiles` array
    return true // or `false` to abort uninstallation
})
```

**NOTE**: if you use multiple shells on your system (e.g. both bash and powershell) and you want completion on all of them, you will need to perform the installation on each of them.

### Completion handling

TODO

## License

See the [LICENSE](LICENSE.md) file for license rights and limitations (MIT).