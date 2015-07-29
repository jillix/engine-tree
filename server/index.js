var Path = require("path");
var Fs = require("fs");
var RimRaf = require("rimraf");
var Streamp = require("streamp");
var Mkdirp = require("mkdirp");

const SERVICE_PROJECTS = process.env.ENGINE_APPS || Ul.home() + "/engine_repos";

exports.readDir = function (stream) {
    stream.data(function (data) {

        // validate data
        if (!data.path) { 
            stream.write(new Error("Missing the path.", [])); 
            return;
        }
        if (!data.project) {
            stream.write(new Error("Missing the project.", []));
            return;
        }

        var path = Path.join(SERVICE_PROJECTS, data.project, data.path);
        Fs.readdir(path, function (err, items) {

            if (err) {
                stream.write(err);
                return;
            }

            items = items.map(function (c) {
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


            function sort(a, b) {
                return a.text > b.text ? 1 : -1;
            }

            var files = items.filter(function (c) { return c.type !== "folder"; }).sort(sort);
            var folders = items.filter(function (c) { return c.type === "folder"; }).sort(sort);

            return stream.write(null, folders.concat(files));
        });
    });
};

exports.delete = function (stream) {
    stream.data(function (data) {

        // validate data
        if (!data.path) { 
            stream.write(new Error("Missing the path.", [])); 
            return stream.end();
        }
        if (!data.project) {
            stream.write(new Error("Missing the project.", []));
            return stream.end();
        }

        var path = Path.join(SERVICE_PROJECTS, data.project, data.path);
        RimRaf(path, function (err) {
            stream.write(err);
            return stream.end();
        });
    });
};

exports.newFolder = function (stream) {
    stream.data(function (data) {

        // validate data
        if (!data.path) { 
            stream.write(new Error("Missing the path.", [])); 
            return stream.end();
        }
        if (!data.project) {
            stream.write(new Error("Missing the project.", []));
            return stream.end();
        }
        if (!data.data || !data.data.name) {
            stream.write(new Error("Missing the new name.", []));
            return stream.end();
        }

        var path = Path.join(SERVICE_PROJECTS, data.project, data.path);
        var newPath = path.split("/").slice(0, -1).concat([data.data.name]).join("/");
        Mkdirp(newPath, function (err) {
            stream.write(err);
            return stream.end();
        });
    });
};

exports.newFile = function (stream) {
    stream.data(function (data) {

        // validate data
        if (!data.path) { 
            stream.write(new Error("Missing the path.", [])); 
            return stream.end();
        }
        if (!data.project) {
            stream.write(new Error("Missing the project.", []));
            return stream.end();
        }
        if (!data.data || !data.data.name) {
            stream.write(new Error("Missing the new name.", []));
            return stream.end();
        }

        var path = Path.join(SERVICE_PROJECTS, data.project, data.path);
        var newPath = path.split("/").slice(0, -1).concat([data.data.name]).join("/");
        var streamp = new Streamp.writable(newPath);
        streamp.end("");

        stream.write(null);
        stream.end(null);
    });
};

exports.rename = function (stream) {
    stream.data(function (data) {

        // validate data
        if (!data.path) { 
            stream.write(new Error("Missing the path.", [])); 
            return stream.end();
        }
        if (!data.project) {
            stream.write(new Error("Missing the project.", []));
            return stream.end();
        }
        if (!data.data || !data.data.name) {
            stream.write(new Error("Missing the new name.", []));
            return stream.end();
        }

        var path = Path.join(SERVICE_PROJECTS, data.project, data.path);
        var newPath = path.split("/").slice(0, -1).concat([data.data.name]).join("/");
        Fs.rename(path, newPath, function (err) {
            stream.write(err);
            return stream.end();
        });
    });
};
