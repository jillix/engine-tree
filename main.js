var Bind = require("github/jillix/bind");
var Events = require("github/jillix/events");

module.exports = function(config) {

    var DmsTree = this;
    Events.call(DmsTree, config);

    var storage = {};

    DmsTree.buildFrom = function (items, options) {

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

                    DmsTree.buildFrom(docs, options);
                });

                crudObj = {
                    t: "_list",
                    q: {
                        _ln: {
                            $elemMatch: {
                                _id: items._id
                            }
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

                    $(".all", $all).text(docs.length);
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
        // an empty array
        if (!items || !items.length) { return; }
        storage = {};

        var $folderTempl = $(".folder-template", $typeTemplates);
        var $itemsToAppend = $("<div>");


        for (var i in items) {
            var item = items[i];

            storage[item._id] = item;

            var $newFolder = $folderTempl.clone();

            $newFolder
                .attr("data-id", item._id)
                .removeClass("folder-template")
                .find(".name").text(item.name)

            $itemsToAppend.append($newFolder);
        }

        $tree.append($itemsToAppend.html());
        $tree.find("li").hide().slideDown();
    };

    $(DmsTree.dom).off("click", ".folder");
    $(DmsTree.dom).on("click", ".folder", function () {

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
            }, 1000);
        });
    });

    ///////////////////////////////
    // Open-Close functions
    ///////////////////////////////
    DmsTree.openFolder = function (jQueryElement) {

        jQueryElement = $(jQueryElement);
        if (jQueryElement.attr("data-loading")) { return; }

        var $openClose = jQueryElement.find(".open-close");

        $openClose.children().first().addClass("hide");
        $openClose.children().last().removeClass("hide");
        jQueryElement.find(".chevron").toggleClass("icon-chevron-right icon-chevron-down");
    };

    DmsTree.closeFolder = function (jQueryElement) {
        jQueryElement = $(jQueryElement);
        if (jQueryElement.attr("data-loading")) { return; }

        var $openClose = jQueryElement.find(".open-close");

        $openClose.children().last().addClass("hide");
        $openClose.children().first().removeClass("hide");
        jQueryElement.find(".chevron").toggleClass("icon-chevron-right icon-chevron-down");
    };

    DmsTree.folderIsOpened = function (jQueryElement) {
        jQueryElement = $(jQueryElement);
        var $openClose = jQueryElement.find(".open-close");

        if ($openClose.children().last().hasClass("hide")) { return false; }
        return true;
    };

    ///////////////////////////////
    // Loading functions
    ///////////////////////////////
    DmsTree.startLoading = function (jQueryElement) {
        jQueryElement = $(jQueryElement);
        var $loading = jQueryElement.find(".loading-toggle");

        $loading.children().first().removeClass("hide");
        $loading.children().last().addClass("hide");
        jQueryElement.attr("data-loading", "true");
    };

    DmsTree.stopLoading = function (jQueryElement) {
        jQueryElement = $(jQueryElement);
        var $loading = jQueryElement.find(".loading-toggle");

        $loading.children().first().addClass("hide");
        var $last = $loading.children().last();
        $last.removeClass("hide");
        jQueryElement.attr("data-loading", "");
    };

    DmsTree.isLoading = function (jQueryElement) {
        jQueryElement = $(jQueryElement);
        if (jQueryElement.attr("data-loading")) { return true; }
        return false;
    };

    DmsTree.expand = function (clickedElement, docs) {

        clickedElement = $(clickedElement);

        if (clickedElement.next().prop("tagName") === "UL") { return; }

        var $ul = $("<ul>");
        for (var i in docs) {
            var doc = docs[i];
            storage[doc._id] = doc;
            var templClass = doc.type + "-template";
            var $newItem = $("." + templClass)
                            .clone()
                            .removeClass(templClass);

            $newItem.attr("data-id", doc._id);
            $newItem.find(".name").text(doc.name);
            $ul.append($newItem);
        }

        clickedElement.after($ul);
        $ul.hide().slideDown();
    };

    DmsTree.collapse = function (clickedElement) {
        clickedElement = $(clickedElement);
        var folderContent = clickedElement.next();
        folderContent.slideUp(function () {
            folderContent.remove();
        });
    };
};
