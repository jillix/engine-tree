var Path = require("path");

const ENGINE_APPS = process.env.ENGINE_APPS;
const FLOW_LINKS = {
    getTree: {
        IN: "readDir",
        OUT: "readDir"
    }
};


exports.init = function () {
    /**
     *
     *
     * @return {undefined}
     */
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
        if (!data.path) { return link.end(new Error("Missing the path.")); }
        if (!data.project) { return link.end(new Error("Missing the project.")); }
        var path = Path.join(ENGINE_APPS, data.path);
        link.end(null, [
            {"text" : "Root", "id" : "1", "children" : true}
        ]);
    });
};
