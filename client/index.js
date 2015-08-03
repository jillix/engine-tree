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

    // init the streams object
    self._streams = self._streams || {};

    // create the streams
    self._streams.readDir = self.flow("readDir");

    // init streams
    self._loadedStream = self.flow("loaded");
    self._openPathFinishedStream = self.flow("openPathFinished");
    self._selectedFileStream = self.flow("selected.file");
    self._beforeSelectStream = self.flow("beforeSelect");
    self._nodeOpenedStream = self.flow("nodeOpened");
};

function actionGen(action) {
    return function (node, data) {
        var item = node;
        var jsTreeInst = null;
        if (data && data.node) {
            item = data.node;
            jsTreeInst = $.jstree.reference(item);
        } else {
            jsTreeInst = $.jstree.reference(item.reference);
            item = jsTreeInst.get_node(node.reference);
        }

        function req (data, act) {
            act = act || action;

            var str = self.flow(act);

            // data handler
            str.data(function (data) {
                jsTreeInst.refresh();
            });

            // error handler
            str.error(function (err) {
                alert(err);
            });

            self.write(null, {
                project: self.project,
                path: item.original.path,
                data: data
            });
        }

        switch (action) {
            case "do_rename":
                return jsTreeInst.edit(item);
            case "do_newFolder":
            case "do_newFile":
                var newNode = jsTreeInst.create_node(item.parent);
                jsTreeInst.edit(newNode);
                self.tmp.creating = action.replace("do_", "");
                self.tmp.path = item.original.path
                return;
            case "renamed":
                if (self.tmp.creating) {
                    item.original.path = self.tmp.path;
                }
                req({ name: item.text }, self.tmp.creating);
                self.tmp.creating = null;
                self.tmp.path = null;
                return;
        }

        req();
    };
}

exports.load = function (data) {
    var self = this;

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

            self._beforeSelectStream.write(null, {
                callback: function (err, data) {
                    cb(data.select);
                }
            });
        },
        core: {
            data: function (node, cb) {
                // call open method
                self.open({
                    path: Object(node.original).path,
                    callback: function (err, data) {
                        if (err) { 
                            console.error(new Error(err));
                            return;
                        }
                        cb(data);
                    }
                });
            },
            check_callback: true
        },
        contextmenu: {
            items: {
                createFolder: {
                    label: "New folder",
                    icon : "octicon octicon-file-directory",
                    action: actionGen("do_newFolder")
                },
                createFile: {
                    label: "New file",
                    icon: "octicon octicon-file-text",
                    action: actionGen("do_newFile")
                },
                rename: {
                    label: "Rename",
                    icon: "octicon octicon-pencil",
                    action: actionGen("do_rename")
                },
                deleteItem: {
                    label: "Delete",
                    icon: "octicon octicon-x",
                    action: actionGen("delete")
                }
            },
            select_node: false
        }
    }).on("changed.jstree", function (e, data) {
        if (!data.node) { return; }

        var isFolder = data.node.type === "folder";
        if (!isFolder) {
            self._selectedFileStream.write(null, {
                selectedFile: data.node.original.path
            });
        }
        self.selected = data.node.original.path;
    }).on("loaded.jstree", function (e, data) {
        self._loadedStream.write(null, data);
    }).on("open_node.jstree", function (e, data) {
        self._nodeOpenedStream.write(null, data);
    }).on("rename_node.jstree", actionGen("renamed"));
};

function openPath(p, i, $parent) {
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
        return self._openPathFinishedStream.write(null);
    }

    if (!$parent) {
        $parent = self.$jstree;
    }
    $parent = $($parent);
    var $cListItem = $parent.find(">ul>li").find(">a").filter(function () {
        return $(this).text().trim() === c;
    });

    if ($cListItem.find(">ul").length) {
        return openPath.call(self, p, i + 1, "#" + $cListItem.parent().attr("id"));
    } else {
        setTimeout(function() {

            // this a bit wrong
            self.nodeOpenedListener = function () {
                openPath.call(self, p, i + 1, "#" + $cListItem.parent().attr("id"));
            };
            if ($cListItem.find("i").hasClass("octicon-file-directory")) {
                $cListItem.dblclick();
            } else {
                $cListItem.click();
                self._openPathFinishedStream.write(null);
            }
        }, 0);
    }
}

// listen for nodeOpened event
exports.nodeOpened = function (data) {
    var self = this;

    if (self.nodeOpenedListener && typeof self.nodeOpenedListener === "function") {
        self.nodeOpenedListener();
    }
};

/**
 * openPath
 * Opens a path to a file or directory.
 *
 * @name openPath
 * @function
 * @param {Object} data The data object containing:
 *
 *  - `path` (Strnig): The path to open.
 *  - `start` (Number): The path start index (splitted by `/`). Default is `3`.
 */
exports.openPath = function (data) {
    var self = this;

    if (!data.path) {
        return;
    }

    var splits = data.path;

    if (typeof splits === "string") {
        splits = split.split("/");
    }

    openPath.call(self, splits.slice(data.start || 3));
};

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
exports.open = function (data) {
    var self = this;

    var callback = data.callback || function (err) {
        if (err) { return alert(err); }
    };

    if (data.path === undefined) {
        return callback(null, [{
            path: "/",
            type: "folder",
            text: "/",
            children: true
        }]);
    }

    // listen for data
    self._streams.readDir.data(function (data) {
        callback(null, data);
    });

    // handle error
    self._streams.readDir.error(function (err) {
        callback(err, null);
    });

    // send data
    self._streams.readDir.write(null, {
        project: self.project,
        path: data.path
    });
};