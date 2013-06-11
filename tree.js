module.exports = function (module) {

    var self = this;

    /*
     *  Get extension of file
     *  ---------------------
     *  Example: index.html
     *                ^....
     *      => html
     */
    function getExtensionOf (file) {
        if (file.indexOf(".") === -1) { return undefined; }

        return file.substring(file.lastIndexOf(".") + 1);
    }

    /*  +=======================+
     *  |   Public functions    |
     *  +=======================+
     */

    function init (config) {
        // here will go the process config
    }

    /*
     *  Build tree function
     *  -------------------
     *  Receives as argument an array like in
     *  the example bellow:
     *
     *  [
     *      "file1",
     *      "file2",
     *      "dir1/",
     *      "file_n",
     *  ]
     *
     *  This function will build the files structure
     *  in HTML
     */
    function buildFrom (items, options) {

        var template = options.template;
        var container = options.container;

        // TODO Use jQuery to create elements
        var tree = "";
        var ul = '<ul style="overflow: hidden;">';
        li += ul;

        // items: folders or files
        for (var i in items) {
            var plusNone;
            var li = '<li>';
            var name = items[i];
            var dataFile;

            if (items[i].substr(-1) === "/") {
                plusNone = "plus";
                type = "directory";
                name = name.replace("/", "");
            }
            else {
                plusNone = "none";
                type = "file ext-" + getExtensionOf(items[i]);
                dataFile = "/" + items[i];
            }

            li += '<span class="' + plusNone + '"></span>' +
                  '<a ' + (dataFile ? 'data-file="' + dataFile + '"': '') +
                  ' class="' + type + '"> ' + name + '</a>' +
                  '</li>';

            tree += li;
        }

        tree += '</li>';

        $(container).html(tree);
    }

    return {
        init: init,
        buildFrom: buildFrom
    };
};


module.exports = function (module, config) {

    var tree = new Tree(module);

    for (var i in tree) {
        tree[i] = module[i] || tree[i];
    }

    tree = Object.extend(tree, module);
    tree.init(config);

    return tree;
}
