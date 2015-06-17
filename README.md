# Engine Tree
Tree module for Engine.

## Configuration

 - `container` (String): The query selector of the tree container.

## Events

 - :arrow_up: `pathOpened` - After a path was opened.
 - :arrow_up: `selected.folder` - After a folder was selected.
 - :arrow_up: `selected.file` - After a file was selected.
 - :arrow_up: `changed" - Selection changed.
 - :arrow_up: `loaded` - The tree was loaded.
 - :arrow_up: `nodeOpened` - A node was opened.

## Documentation
### `setProject(ev, data)`
Sets the project name internally.

#### Params
- **Event** `ev`: The event object.
- **Object** `data`: An object containing the following fields:
 - `project` (String): The project name.

### `openPath(ev, data)`
Opens a path to a file or directory.

#### Params
- **Event** `ev`: The event object.
- **Object** `data`: An object containing the following fields:
 - `path` (Strnig): The path to open.
 - `start` (Number): The path start index (splitted by `/`). Default is `3`.

### `open(ev, data)`
Opens a file/directory, in the current directory.

#### Params
- **Event** `ev`: The event object.
- **Object** `data`: An object containing the following fields:
 - `path` (Strnig): The path to open.

## How to contribute
1. File an issue in the repository, using the bug tracker, describing the
   contribution you'd like to make. This will help us to get you started on the
   right foot.
2. Fork the project in your account and create a new branch:
   `your-great-feature`.
3. Commit your changes in that branch.
4. Open a pull request, and reference the initial issue in the pull request
   message.

## License
See the [LICENSE](./LICENSE) file.
