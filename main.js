var Bind = require("github/jillix/bind");
var Events = require("github/jillix/events");

module.exports = function(config) {

    var DmsTree = this;
    Events.call(DmsTree, config);
    var storage = {};

    ///////////////////
    // HANDLERS
    ///////////////////
    $(DmsTree.dom).on("click", ".list", function () {
        var $item = $(this).closest("li");

        DmsTree.removeActive("*");
        DmsTree.setActive($item);

        var filters = (storage[$item.attr("data-id")] || {}).filters || [];
        DmsTree.emit("setFilters", filters, true);
        return false;
    }).on("click", ".folder", function () {

        var $item = $(this);
        $item = $item.closest("li");

        if (DmsTree.isLoading($item)) { return; }

        var dataItem = storage[$item.attr("data-id")];

        if (DmsTree.folderIsOpened($item)) {
            DmsTree.closeFolder($item);
            DmsTree.collapse($item);
            return;
        }

        DmsTree.startLoading($item);

        var crudObj = {
            t: "_list",
            q: {
                "_ln._id": dataItem._id
            }
        }

        DmsTree.emit("find", crudObj, function (err, docs) {

            if (err) {
                alert(err);
                return;
            }

            // TODO Just simulating a timeout
            setTimeout(function () {
            DmsTree.expand($item, docs);
            DmsTree.stopLoading($item);
            DmsTree.openFolder($item);
            }, 200);
        });
        return false;
    }).on("click", ".all", function () {

        DmsTree.removeActive(".dms-tree *");
        DmsTree.setActive($(this));

        DmsTree.emit("setFilters", [], true);
        return false;
    });

    ///////////////////////////////
    // Generate the tree from items
    ///////////////////////////////
    DmsTree.buildFrom = function (items) {

        var $tree = $(".dms-tree", DmsTree.dom);
        var $typeTemplates = $(".type-templates", DmsTree.dom);

        switch (Object.prototype.toString.call(items)) {
            // object
            case "[object Object]":
                var crudObj = {
                    t: "_list",
                    q: {
                        "_ln._tp": {
                            $ne: "_list"
                        },
                        "_ln": {
                            $elemMatch: {
                                _id: items._id,
                                _tp: "_template"
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

                    DmsTree.buildFrom(docs);
                });

                crudObj = {
                    t: "_list",
                    q: {
                        _ln: {
                            $elemMatch: {
                                _id: items._id
                            }
                        },
                        type: {
                            $ne: "folder"
                        }
                    },
                    f: {
                        $none: 1,
                        _id: 0
                    }
                };

                DmsTree.emit("find", crudObj, function (err, docs) {
                    if (err) {
                        alert(err);
                        return;
                    }

                    var $all = $(".all-template", $typeTemplates)
                        .clone()
                        .removeClass("all-template");

                    $(".all-value", $all).text(docs.length);
                    $tree.prepend($all);
                });
                return;
            // array
            case "[object Array]":
                break;
            // other type
            default:
                return;
        }

        $tree.empty();
        storage = {};

        // an empty array
        if (!items || !items.length) { return; }

        var $itemsToAppend = $("<div>");

        for (var i in items) {
            var item = items[i];
            var $newItem = $("." + item.type + "-template", $typeTemplates).clone();

            storage[item._id] = item;

            $newItem
                .attr("data-id", item._id)
                .removeClass(item.type + "-template")
                .find(".name").text(item.name)

            $itemsToAppend.append($newItem);
        }

        $tree.append($itemsToAppend.html());
        $tree.find("li").hide().slideDown();
    };


    ///////////////////////////////
    // Set active class
    ///////////////////////////////
    DmsTree.setActive = function (jQueryElement) {
        jQueryElement = $(jQueryElement, DmsTree.dom);
        jQueryElement.addClass("active");
    };

    DmsTree.removeActive = function (jQueryElement) {
        jQueryElement = $(jQueryElement, DmsTree.dom);
        jQueryElement.removeClass("active");
    };

    ///////////////////////////////
    // Open-Close functions
    ///////////////////////////////
    DmsTree.openFolder = function (jQueryElement) {

        jQueryElement = $(jQueryElement, DmsTree.dom);
        if (jQueryElement.attr("data-loading")) { return; }

        var $openClose = jQueryElement.find(".open-close");

        $openClose.children().first().addClass("hide");
        $openClose.children().last().removeClass("hide");
        jQueryElement.find(".chevron").toggleClass("icon-chevron-right icon-chevron-down");
    };

    DmsTree.closeFolder = function (jQueryElement) {
        jQueryElement = $(jQueryElement, DmsTree.dom);
        if (jQueryElement.attr("data-loading")) { return; }

        var $openClose = jQueryElement.find(".open-close");

        $openClose.children().last().addClass("hide");
        $openClose.children().first().removeClass("hide");
        jQueryElement.find(".chevron").toggleClass("icon-chevron-right icon-chevron-down");
    };

    DmsTree.folderIsOpened = function (jQueryElement) {
        jQueryElement = $(jQueryElement, DmsTree.dom);
        var $openClose = jQueryElement.find(".open-close");

        if ($openClose.children().last().hasClass("hide")) { return false; }
        return true;
    };

    ///////////////////////////////
    // Loading functions
    ///////////////////////////////
    DmsTree.startLoading = function (jQueryElement) {
        jQueryElement = $(jQueryElement, DmsTree.dom);
        var $loading = jQueryElement.find(".loading-toggle");

        $loading.children().first().removeClass("hide");
        $loading.children().last().addClass("hide");
        jQueryElement.attr("data-loading", "true");
    };

    DmsTree.stopLoading = function (jQueryElement) {
        jQueryElement = $(jQueryElement, DmsTree.dom);
        var $loading = jQueryElement.find(".loading-toggle");

        $loading.children().first().addClass("hide");
        var $last = $loading.children().last();
        $last.removeClass("hide");
        jQueryElement.attr("data-loading", "");
    };

    DmsTree.isLoading = function (jQueryElement) {
        jQueryElement = $(jQueryElement, DmsTree.dom);
        if (jQueryElement.attr("data-loading")) { return true; }
        return false;
    };

    ////////////////////
    // EXPAND / COLLAPSE
    ////////////////////
    DmsTree.expand = function (jQueryElement, docs) {

        jQueryElement = $(jQueryElement, DmsTree.dom);

        if (jQueryElement.next().prop("tagName") === "UL") { return; }

        var $ul = $("<ul>");
        for (var i in docs) {
            var doc = docs[i];
            storage[doc._id] = doc;

            var templClass = doc.type + "-template";
            var $newItem = $("." + templClass)
                            .clone()
                            .removeClass(templClass);

            $newItem.attr("data-id", doc._id)
                    .find(".name").text(doc.name);

            $ul.append($newItem);
        }

        jQueryElement.after($ul);
        $ul.hide().slideDown();
    };

    DmsTree.collapse = function (jQueryElement) {
        jQueryElement = $(jQueryElement, DmsTree.dom);
        var folderContent = jQueryElement.next();
        folderContent.slideUp(function () {
            folderContent.remove();
        });
    };


    //////////////////////
    // NEW LIST/NEW FOLDER
    //////////////////////
    DmsTree.newList = function (listObj, callback) {
        debugger;
        // TODO
    };

    DmsTree.emit("ready", config);
};
