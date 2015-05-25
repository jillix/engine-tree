// Dependencies
var $ = require("/libs/jquery");

/**
 * init
 *
 * @name init
 * @function
 * @return {undefined}
 */
exports.init = function() {
    var self = this;

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
                self.link(act, function (err) {
                    if (err) { alert(err); }
                    jsTreeInst.refresh();
                }).send(null, {
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
        plugins: ["dnd", "types", "wholerow", "contextmenu", "search"],
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
        core: {
            data: function (node, cb) {
                self.open(null, {
                    path: Object(node.original).path,
                    callback: function (err, data) {
                        if (err) { alert(err); }
                        cb(data);
                        self.emit("pathOpened", null, err, data);
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
        self.emit("selected." + (isFolder ? "folder" : "file"));
        self.selected = data.node.original.path;
        self.emit("changed", e, data);
    }).on("loaded.jstree", function (e, data) {
        self.emit("loaded", e, data);
    }).on("open_node.jstree", function (e, data) {
        self.emit("nodeOpened", e, data);
    }).on("rename_node.jstree", actionGen("renamed"));
};

exports.setProject = function (ev, data) {
    this.project = data.project;
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

exports.openPath = function (ev, data) {
    if (!data.path) {
        return;
    }

    var splits = data.path;
    var self = this;

    if (typeof splits === "string") {
        splits = split.split("/");
    }

    openPath.call(self, splits.slice(data.start || 3));
};

exports.open = function (ev, data) {
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
    self.link("readDir", callback).send(null, {
        project: self.project,
        path: data.path
    });
};
