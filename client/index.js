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
        plugins: ["dnd", "types", "wholerow" ],
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
                        if (err) { return alert(err); }
                        cb(data);
                    }
                });
            },
        }
    }).on("changed.jstree", function (e, data) {
        self.emit("changed", e, data);
    });
};

exports.setProject = function (ev, data) {
    this.project = data.project;
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
