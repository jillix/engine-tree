var Bind = require("github/jillix/bind");
var Events = require("github/jillix/events");

module.exports = function(config) {

    var DmsTree = this;
    Events.call(DmsTree, config);

    DmsTree.buildFrom = function (items, options) {

        switch (Object.prototype.toString.call(items)) {
            // object
            case "[object Object]":
                var crudObj = {
                    t: "_list",
                    q: {
                        _ln: {
                            $elemMatch: {
                                _id: items._id
                            }
                        }
                    }
                };

                // -> emit -> bind-crud -> callback -> buildFrom Array
                DmsTree.emit("find", crudObj, function (err, docs) {
                    if (err) {
                        alert(err);
                        return;
                    }

                    DmsTree.buildFrom(docs, options);
                });
                return;
            // array
            case "[object Array]":
                break;
            // other type
            default:
                return;
        }

        // an empty array
        if (!items || !items.length) { return; }

        var tree = $(".dms-tree", DmsTree.dom);
        var folderTempl = $(".folder-template", tree);

        var itemsToAppend = $("<div>");

        for (var i in items) {
            var item = items[i];

            switch (item.type) {
                case "folder":
                    var newFolder = folderTempl.clone();
                    newFolder
                        .removeClass("folder-template")
                        .find(".name").text(item.name)
                    itemsToAppend.append(newFolder);
                    break;
            }
        }

        tree.append(itemsToAppend.html());
    };

    /*
     *  Adds .loading class to jQueryElement
     */
    DmsTree.startLoading = function (jQueryElement) {

        jQueryElement = $(jQueryElement);
        jQueryElement.addClass("loading");
    };

    DmsTree.stopLoading = function (jQueryElement) {
        jQueryElement = $(jQueryElement);
        jQueryElement.removeClass("loading");
    };

    DmsTree.expand = function (clickedElement) {

        clickedElement = $(clickedElement);
        if (!clickedElement.next().next().length) { return; }

        clickedElement.next().next().show();
        clickedElement
            .removeClass("plus")
            .addClass("minus");
    };

    DmsTree.collapse = function (clickedElement) {

        clickedElement = $(clickedElement);
        if (!clickedElement.next().next().length) { return; }

        clickedElement.next().next().hide();
        clickedElement
            .removeClass("minus")
            .addClass("plus");
    };
};
