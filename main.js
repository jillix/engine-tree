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

        if (!items || !items.length) { return; }
        options = options || {};

        var selector = $(options.selector);
        var howToAdd = options.howToAdd;

        var dataFileOfParent = options.dataFileOfParent;

        // TODO Use jQuery to create elements
        var tree = "<ul>";
        var ul = '<ul style="overflow: auto;">';
        li += ul;

        // items: folders or files
        for (var i in items) {
            var plusNone;
            var li = "<li>";
            var name = items[i];
            var dataFile;

            // if ends with "/", it's a directory
            if (items[i].substr(-1) === "/") {
                plusNone = "plus";
                type = "directory";
                name = name.replace("/", "");
                dataFile = dataFileOfParent + items[i];
            }
            else {
                plusNone = "none";
                type = "file ext-" + getExtensionOf(items[i]);
                dataFile = dataFileOfParent + items[i];
            }

            li += '<span class="' + plusNone + '"></span>' +
                  '<a data-file="' + dataFile + '"' +
                  ' class="' + type + '"> ' + name + '</a>' +
                  '</li>';

            tree += li;
        }

        tree += '</li></ul>';

        switch (howToAdd) {
            case "after":
                selector.next().remove();
                break;
            case "before":
                selector.prev().remove();
                break;
            case "html":
                selector.html("");
                break;
        }

        selector[howToAdd](tree);
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
