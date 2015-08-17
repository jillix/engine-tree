// Dependencies
var $ = require("/libs/jquery");

// Add the custom select plugin
$.jstree.defaults.conditionalselect = function (node, cb) { cb(true); };
$.jstree.plugins.conditionalselect = function (options, parent) {
    this.activate_node = function (obj, e) {
        var that = this;
        this.settings.conditionalselect.call(this, this.get_node(obj), function (select) {
            if (select) {
                parent.activate_node.call(that, obj, e);
            }
        });
    };
};

/*!
 * init
 *
 * @name init
 * @function
 */
exports.init = function() {
    var self = this;
};

exports.load = function (data) {
    var self = this;
    self._isLoaded = false;

    // set project
    if (!data.project) {
        return console.error(new Error("Project name not provided"));
    }
    self.project = data.project;

    self.tmp = {};
    self.$jstree = $(self._config.container).jstree({
        plugins: ["dnd", "types", "wholerow", "contextmenu", "search", "conditionalselect"],
        types: {
            "default": {
                icon: "octicon octicon-file-text"
            },
            folder: {
                icon : "octicon octicon-file-directory"
            },
            binary: {
                icon : "octicon octicon-file-binary"
            },
            code: {
                icon : "octicon octicon-file-code"
            },
            media: {
                icon : "octicon octicon-file-media"
            },
            pdf: {
                icon : "octicon octicon-file-pdf"
            },
            symlink: {
                icon : "octicon octicon-file-symlink"
            },
            zip: {
                icon : "octicon octicon-file-zip"
            }
        },
        conditionalselect: function (node, cb) {

            if (self._config.alwaysSelect) {
                return cb(true);
            }

            // TODO This is more or less a hack -- currently we don't need
            //      to do anything before selecting a folder
            if (node.original.type === "folder") {
                return cb(true);
            }

            // emit to a before select handler
            self.flow("beforeSelect").write(null, {
                callback: function (err, data) {
                    cb(data.select);
                }
            });
        },
        core: {
            data: function (node, cb) {

                // get the current directory
                open.call(self, {
                    path: Object(node.original).path
                }, function (err, data) {

                    if (err) {
                        return console.error(new Error(err));
                    }

                    cb(data);
                });
            },
            check_callback: true
        }
    }).on("loaded.jstree", function (e, data) {
        self._isLoaded = true;
        self.flow("loaded").write(null, data);
    }).on("changed.jstree", function (e, data) {
        if (!data || !data.event || !data.node) {
            return;
        }

        // check if event was forced
        if (!data.event.forcedSelect) {
            self.flow("pathChanged").write(null, {
                selectedFile: data.node.original.path
            });
        }

        var isFolder = data.node.type === "folder";
        if (!isFolder) {
            self.flow("fileSelected").write(null, {
                selectedFile: data.node.original.path
            });
        }
    });
};

exports.openPath = function (data) {
    var self = this;

    // do not open a path if the tree is not loaded
    if (!self._isLoaded || self._openPathInProgress || !data._path) {
        return;
    }

    // prevent multiple open path calls
    self._openPathInProgress = true;

    var splits = data._path;
    if (typeof splits === String) {
        splits = splits.split("/");
    }

    // tree is about to change
    self.flow("treeRefreshed").write(null);

    // refresh tree
    $(self._config.container).jstree("deselect_all").jstree("close_all");

    openPath.call(self, splits.slice(data.start || 3));
};

function openPath (p, i, $parent) {
    var self = this;

    i = i || 0;

    if (typeof p === "string") {
        p = ["/"].concat(p.split("/"));
    }

    if (p[0] !== "/") {
        p.unshift("/");
    }

    var c = p[i];
    if (!c) {
        self._openPathInProgress = false;
        return;
    }

    if (!$parent) {
        $parent = self.$jstree;
    }
    $parent = $($parent);
    var $cListItem = $parent.find(">ul>li").filter(function () {
        return $(this).find("a").text().trim() === c;
    });

    if ($cListItem.find(">ul").length) {
        return openPath.call(self, p, i + 1, "#" + $cListItem.parent().attr("id"));
    } else {
        setTimeout(function() {

            var listItemId = $cListItem.attr("id");

            // if file, select it
            if ($cListItem.hasClass("jstree-leaf")) {
               $(self._config.container).jstree('select_node', listItemId, false, false, {
                    forcedSelect: true
               });
               self._openPathInProgress = false;
            } else {
                // if directory, open it
                $(self._config.container).jstree('open_node', listItemId, function(e, data) {
                    openPath.call(self, p, i + 1, "#" + listItemId);
                }, true);
            }
        }, 0);
    }
}

/**
 * open
 * Opens a file/directory, in the current directory.
 *
 * @name open
 * @function
 * @param {Object} data The data object containing:
 *
 *  - `path` (Strnig): The path to open.
 */
function open (data, callback) {
    var self = this;

    if (data.path === undefined) {
        return callback(null, [{
            path: "/",
            type: "folder",
            text: "/",
            children: true
        }]);
    }

    // create a non cached stream
    var readDirStream = self.flow("readDir", true);

    // listen for data
    readDirStream.data(function (data) {
        callback(null, data);
        return readDirStream.end();
    });

    // listen for error
    readDirStream.error(function (error) {
        callback(error);
        return readDirStream.end();
    });

    // write data to stream
    readDirStream.write(null, {
        path: data.path,
        project: self.project
    });
};