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

// emit function
// TODO test event in data
// TODO add error
function emit(eventName, data) {
    var self = this;
    self._streams = self._streams || {};

    // create stream
    var str = self._streams[eventName] || (self._streams[eventName] = self.flow(eventName));
    str.write(null, data);
}

// this is not exactly correct
function on(eventName, callback) {
    var self = this;

    self[eventName] = function (stream) {
        stream.data(function (data) {
            callback.call(self, null, data);
        });

        stream.error(function (err) {
            return console.error(new Error(err));
        });
    }
}

/*!
 * init
 *
 * @name init
 * @function
 */
exports.init = function() {
    var self = this;
    self.emit = emit;
    self.on = on;

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

            self.emit("beforeSelect", {
                callback: function (err, data) {
                    cb(data.select);
                }
            });
        },
        core: {
            data: function (node, cb) {
                // todo add err
                // call open method
                self.emit("open", {
                    path: Object(node.original).path,
                    callback: function (err, data) {
                        if (err) { alert(err); }
                        cb(data);
                        // TODO add err
                        self.emit("pathOpened", data);
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
        self[isFolder ? "selectedDir" : "selectedFile"] = data.node.original.path;
        var emitData = {};
        emitData[isFolder ? "selectedDir" : "selectedFile"] = data.node.original.path;
        self.emit("selected." + (isFolder ? "folder" : "file"), emitData);
        self.selected = data.node.original.path;
        self.emit("changed", data);
    }).on("loaded.jstree", function (e, data) {
        self.emit("loaded", data);
    }).on("open_node.jstree", function (e, data) {
        self.emit("nodeOpened", data);
    }).on("rename_node.jstree", actionGen("renamed"));

    // module is ready
    self.emit("ready");
};

/**
 * setProject
 * Sets the project name internally.
 *
 * @name setProject
 * @function
 * @param {Stream} stream The stream object
 *
 *  - `project` (String): The project name.
 *
 */
exports.setProject = function (stream) {
    var self = this;

    stream.data(function (data) {
        self.project = data.project;
    });

    // handle error
    stream.error(function (err) {
        return console.error(new Error(err));
    });
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
        return self.emit("openPathFinished");
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
            self.on("nodeOpened", function () {
                openPath.call(self, p, i + 1, "#" + $cListItem.parent().attr("id"));
            }, true);
            if ($cListItem.find("i").hasClass("octicon-file-directory")) {
                $cListItem.dblclick();
            } else {
                $cListItem.click();
                self.emit("openPathFinished");
            }
        }, 0);
    }
}

/**
 * openPath
 * Opens a path to a file or directory.
 *
 * @name openPath
 * @function
 * @param {Stream} stream The stream object
 *
 *  - `path` (Strnig): The path to open.
 *  - `start` (Number): The path start index (splitted by `/`). Default is `3`.
 */
exports.openPath = function (stream) {
    var self = this;

    stream.data(function (data) {

        if (!data.path) {
            return;
        }

        var splits = data.path;

        if (typeof splits === "string") {
            splits = split.split("/");
        }

        openPath.call(self, splits.slice(data.start || 3));
    });

    // handle error
    stream.error(function (err) {
        return console.error(new Error(err));
    });
};

/**
 * open
 * Opens a file/directory, in the current directory.
 *
 * @name open
 * @function
 * @param {Stream} stream The stream object
 *
 *  - `path` (Strnig): The path to open.
 */
exports.open = function (stream) {
    var self = this;
    stream.data(function (data) {

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

        // create stream
        var str = self.flow("readDir");

        str.data(function (data) {
            callback(null, data);
        });
        str.error(function (err) {
            callback(err, null);
        })
        str.write(null, {
            project: self.project,
            path: data.path
        });
    });

    // handle error
    stream.error(function (err) {
        return console.error(new Error(err));
    });
};