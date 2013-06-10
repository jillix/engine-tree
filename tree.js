module.exports = function (config) {

    var self = this;

    /*
     *  Build tree function
     *  -------------------
     *  Receives as argument an object like in
     *  the example bellow:
     *  {
     *      "files": [
     *          ".gitignore",
     *          "application.json",
     *          "readme.md"
     *      ],
     *      "public": {
     *          "files": [
     *              "sample1.html",
     *              "sample2.html",
     *              "sample3.html",
     *              "tabs.html"
     *          ]
     *      }
     *  }
     *  This function will build the files structure
     *  in HTML
     */
    self.buildTreeFrom = function (files) {
        // TODO
        console.log("Building tree from: ");
        console.log(files);
    };

    /*
     *  Converts an array of paths to tree object
     *  Example:
     *  [
     *      "/.gitignore",
     *      "/application.json",
     *      "/public/sample1.html",
     *      "/public/sample2.html",
     *      "/public/sample3.html",
     *      "/public/tabs.html",
     *      "/readme.md"
     *  ]
     *  The array above will be converted in the
     *  following object
     *  {
     *      "files": [
     *          ".gitignore",
     *          "application.json",
     *          "readme.md"
     *      ],
     *      "public": {
     *          "files": [
     *              "sample1.html",
     *              "sample2.html",
     *              "sample3.html",
     *              "tabs.html"
     *          ]
     *      }
     *  }
     */
    self.convertFromArrayToObject = function (files) {

        // TODO
//         var root = {};
//         root.files = [];
//
//         for (var file in files) {
//             var count = files[file].split("/").length - 1;
//
//             if (count === 1) {
//                 root.files.push(files[file]);
//             }
//             else if (count > 1) {
//                 var dir = files[file].substring(1);
//                 var path = dir.substring(0, dir.indexOf("/"));
//
//                 var dirs = path.split("/");
//                 console.log(dirs);
//
//                 if (!root[dir]) { root[dir] = {}; }
//
//
//             }
//         }
//
//         console.log(tree);
    };
};
