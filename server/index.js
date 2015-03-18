var Path = require("path");
var Fs = require("fs");

const SERVICE_PROJECTS = jxService.paths.projects;
const FLOW_LINKS = {
    getTree: {
        IN: "readDir",
        OUT: "readDir"
    }
};


exports.init = function () {
    var self = this;
    Object.keys(FLOW_LINKS).forEach(function (c) {
        self._access[FLOW_LINKS[c].IN] = true;
        self.on(FLOW_LINKS[c].IN, engine.flow(self, [{
            call: FLOW_LINKS[c].OUT
        }]));
    });
};

exports[FLOW_LINKS.getTree.OUT] = function (link) {
    link.data(function (err, data) {
        if (err) { return link.end(err); }
        if (!data.path) { return link.end(new Error("Missing the path.", [])); }
        if (!data.project) { return link.end(new Error("Missing the project.", [])); }
        var path = Path.join(SERVICE_PROJECTS, data.project, data.path);
        Fs.readdir(path, function (err, files) {
            if (err) { return link.end(err, []); }
            files = files.map(function (c) {
                var cPath = Path.join(path, c);
                var child = {
                    text: c,
                    path: Path.join(data.path, c)
                };
                child.type = "default";
                var stat = Fs.statSync(cPath);
                var ext = cPath.split(".").slice(-1)[0];
                if (stat.isDirectory()) {
                    child.type = "folder";
                    child.children = true;
                } else if (!!(1 & parseInt((stat.mode & parseInt("777", 8)).toString(8)[0]))) {
                    child.type = "binary";
                } else if (stat.isSymbolicLink()) {
                    child.type = "symlink";
                } else {
                    switch (ext) {
                        case "js":
                        case "css":
                        case "js":
                        case "html":
                        case "json":
                            child.type = "code";
                            break;
                        case "eot":
                        case "svg":
                        case "ttf":
                        case "woff":
                            child.type = "binary";
                            break;
                        case "jpg":
                        case "png":
                            child.type = "media";
                            break;
                        case "pdf":
                            child.type = "pdf";
                            break;
                        case "zip":
                            child.type = "zip";
                            break;
                        default:
                            child.type = "default";
                            break;
                    }
                }
                return child;
            });
            link.end(null, files);
        });
    });
};
