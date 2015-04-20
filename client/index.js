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

    $(self._config.container).jstree({
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
        }
    }).on("changed.jstree", function (e, data) {
        self.selected = data.node.original.path;
        self.emit("changed", e, data);
    });
};

exports.setProject = function (ev, data) {
    this.project = data.project;
};

exports.openPath = function (ev, data) {
    if (!data.path) {
        return;
    }


    var splits = data.path;
    var self = this;

    if (typeof splits === "string") {
        splits = split.split("/");
    }

    function seq(i) {
        i = i || 0;
        var c = splits[i];
        if (!c) {
            return self.emit("openPathFinished");
        }
        debugger
        self.on("pathOpened", function (ev, err) {
            debugger
            seq(i + 1);
        }, true);
    }

    seq(data.start || 1);
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
