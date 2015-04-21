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
            animation: false
        }
    }).on("changed.jstree", function (e, data) {
        self.selected = data.node.original.path;
        self.emit("changed", e, data);
    }).on("loaded.jstree", function (e, data) {
        self.emit("loaded", e, data);
    }).on("open_node.jstree", function (e, data) {
        self.emit("nodeOpened", e, data);
    });
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
            $cListItem.dblclick();
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

    openPath.call(self, splits.slice(data.start || 2));
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
