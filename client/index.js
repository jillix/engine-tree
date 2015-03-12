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
            data: [{
                text: "Root node",
                type: "folder",
                children: [{
                    text: "Child node 1",
                    type: "zip"
                }, {
                    text: "Child node 2",
                    type: "binary"
                }]
            }]
        }
    }).on("changed.jstree", function (e, data) {
        self.emit("changed", e, data);
    });
};

exports.open = function (ev, data) {
    var self = this;
    var callback = data.callback || function (err) {
        if (err) { return alert(err); }
    };
    self.link("getTree", callback).send(null, data.path);
};
