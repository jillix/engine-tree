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

        var storedFilter = {
            type: (storage[$item.attr("data-id")] || {}).type
        };

        var filter = $item.attr("data-filter") || storedFilter;
        DmsTree.emit("setFilter", filter);
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
        DmsTree.emit("setFilter", {});
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

        var $itemsToAppend = $("<div>");

        for (var i in items) {
            var item = items[i];
            var $newItem = $("." + item.type + "-template", $typeTemplates).clone();

            storage[item._id] = item;

            $newItem
                .attr("data-id", item._id)
                .attr("data-filter", item._id)
                .removeClass(item.type + "-template")
                .find(".name").text(item.name)

            $itemsToAppend.append($newItem);
        }

        $tree.append($itemsToAppend.html());
        $tree.find("li").hide().slideDown();
    };


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

    ////////////////////
    // EXPAND / COLLAPSE
    ////////////////////
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
