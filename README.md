<!---------------------------------------------------------------------------->
<!-- STOP, LOOK & LISTEN!                                                   -->
<!-- ====================                                                   -->
<!-- Do NOT edit this file directly since it's generated from a template    -->
<!-- file, using https://github.com/IonicaBizau/node-blah                   -->
<!--                                                                        -->
<!-- If you found a typo in documentation, fix it in the source files       -->
<!-- (`lib/*.js`) and make a pull request.                                  -->
<!--                                                                        -->
<!-- If you have any other ideas, open an issue.                            -->
<!--                                                                        -->
<!-- Please consider reading the contribution steps (CONTRIBUTING.md).      -->
<!-- * * * Thanks! * * *                                                    -->
<!---------------------------------------------------------------------------->

# engine-tree

Tree module for Engine.

## Configuration

 - `container` (String): The query selector of the tree container.
 - `alwaysSelect` (Boolean): If `true`, the nodes will be selected always
   without any callback from another module.

## Events

 - :arrow_up: `pathOpened` - After a path was opened.
 - :arrow_up: `selected.folder` - After a folder was selected.
 - :arrow_up: `selected.file` - After a file was selected.
 - :arrow_up: `changed" - Selection changed.
 - :arrow_up: `loaded` - The tree was loaded.
 - :arrow_up: `nodeOpened` - A node was opened.
 - :arrow_up: `beforeSelect` - Emitted before selecting a node.
 - :arrow_up: `openPathFinished` - The full path was loaded.

 - :arrow_down: `_beforeSelectRes` - An instance should emit this event and
   data should contain the `select` boolean field.

## Documentation
For full API reference, see the [DOCUMENTATION.md][docs] file.

## How to contribute
Have an idea? Found a bug? See [how to contribute][contributing].

## License
See the [LICENSE][license] file.

[license]: /LICENSE
[contributing]: /CONTRIBUTING.md
[docs]: /DOCUMENTATION.md