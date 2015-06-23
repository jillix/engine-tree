## Documentation
You can see below the API reference of this module.

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

