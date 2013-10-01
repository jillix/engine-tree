M.wrap('bitbucket/jillix/dms-tree/dev/tree.js', function (require, module, exports) {
var Bind = require("github/jillix/bind");
var Events = require("github/jillix/events");

var LIST_TEMPLATE_ID = "000000000000000000000004";

module.exports = function(config) {

    var DmsTree = this;
    DmsTree.config = config;
    Events.call(DmsTree, config);

    // run the binds
    for (var i = 0; i < DmsTree.config.binds.length; ++i) {
        Bind.call(DmsTree, config.binds[i]);
    }

    var DRAGGABLE = {
        revert: true,
        zIndex: 2500,
        start: function () {
            $(this).effect("highlight", {}, 1000);
            $(this).css("cursor", "move");
        },
        stop: function() {
            $(this).css("cursor", "default");
            $(".stack").css('z-index', '500');
        }
    };

    var storage = {};
    var currentTemplate;

    var ctrlDown = false;

    $(document).on("keydown", function (e) {
        if (e.keyCode === 17) {
            ctrlDown = true;
        }
    }).on("keyup", function (e) {
        if (e.keyCode === 17) {
            ctrlDown = false;
        }
    });

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
    }).on("click", ".folder", function (e) {

        var $item = $(this);
        $item = $item.closest("li");

        if (DmsTree.isLoading($item)) { return; }

        var dataItem = storage[$item.attr("data-id")];

        if (DmsTree.folderIsOpened($item)) {
            DmsTree.closeFolder($item);
            DmsTree.collapse($item);
            return;
        }


        if (e.ctrlKey) {
            DmsTree.setActive($item);
            return;
        }

        DmsTree.startLoading($item);
        var crudObj = {
            t: LIST_TEMPLATE_ID,
            q: {
                parent: dataItem._id,
                template: DmsTree.template
            },
            o: {
                sort: [["type", -1]]
            }
        };

        DmsTree.emit("find", crudObj, function (err, docs) {

            if (err) {
                alert(err);
                return;
            }

            // TODO Just simulating a timeout
            setTimeout(function () {

            DmsTree.expand($item, docs);

            DmsTree.removeActive(".dms-tree *");
            DmsTree.setActive($item);

            DmsTree.stopLoading($item);
            DmsTree.openFolder($item);
            }, 100);
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

                currentTemplate = items;

                var crudObj = {
                    t: LIST_TEMPLATE_ID,
                    q: {
                        parent: { $exists: false },
            //            template: DmsTree.template
                    },
                    o: {
                        sort: [["type", -1]]
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

                return;
            // array
            case "[object Array]":
                break;
            // other type
            default:
                return;
        }

        $tree.empty();

        // count
        crudObj = {
            t: LIST_TEMPLATE_ID,
            q: {
                type: { $ne: "folder" },
                template: DmsTree.template
            },
            f: { $none: 1, _id: 0 }
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
                .find(".name").text(item.name);

            $itemsToAppend.append($newItem);
        }

        $itemsToAppend.find("li").draggable(DRAGGABLE);

        $itemsToAppend.find(".folder").closest("li").droppable({
            over: DmsTree.dragAndDrop.over,
            out: DmsTree.dragAndDrop.out,
            drop: DmsTree.dragAndDrop.drop
        });

        $tree.append($itemsToAppend);
        $tree.find("li").hide().slideDown();
    };


    ///////////////////////////////
    // Set active class
    ///////////////////////////////
    DmsTree.setActive = function (jQueryElement) {
        jQueryElement = $(jQueryElement, DmsTree.dom);

        if (ctrlDown && jQueryElement.hasClass("active")) {
            jQueryElement.toggleClass("active");
        }
        else {
            jQueryElement.addClass("active");
        }

        DmsTree.emit("selectionChanged", DmsTree.getActive("item"));
    };

    DmsTree.removeActive = function (jQueryElement) {

        if (ctrlDown) { return; }

        jQueryElement = $(jQueryElement, DmsTree.dom);
        jQueryElement.removeClass("active");

        DmsTree.emit("selectionChanged", DmsTree.getActive("item"));
    };

    //////////////////////////////
    // Get active (item/element)
    //////////////////////////////
    DmsTree.getActive = function (item) {

        var jQueryElements = $(DmsTree.dom).find(".active");
        if (!jQueryElements.length) { return undefined; }

        if (item === "item") {
            var activeItems = [];

            if (jQueryElements.length === 1) {
                activeItems.push(storage[jQueryElements.attr("data-id")]);
                return activeItems
            }

            jQueryElements.each(function () {
                activeItems.push(storage[$(this).attr("data-id")]);
            })

            return activeItems;
        }

        return jQueryElements;
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

        $ul.find("li").draggable(DRAGGABLE);

        $(".folder", $ul).closest("li").droppable({
            over: DmsTree.dragAndDrop.over,
            out: DmsTree.dragAndDrop.out,
            drop: DmsTree.dragAndDrop.drop
        });

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

        if (!currentTemplate) { return alert("Select a template, first."); }
        callback = callback || function () {};

        DmsTree.emit("getFilters", function (filters) {

            listObj.filters = filters;
            listObj.template = DmsTree.template;

            var crudObj = {
                t: LIST_TEMPLATE_ID,
                d: listObj
            };

            DmsTree.emit("insert", crudObj, function (err, insertedDoc) {

                closeModals();

                if (err) {
                    callback(err);
                    alert(err);
                    return;
                }

                callback(err, insertedDoc);
                DmsTree.emit("refresh");
            });
        });
    };

    //////////////////////
    // EDIT LIST
    //////////////////////
    DmsTree.editList = function (listObj, callback) {

        var activeItem = DmsTree.getActive("item")[0];

        for (var key in listObj) {
            activeItem[key] = listObj[key];
        }

        var newItem = JSON.parse(JSON.stringify(activeItem));
        delete newItem._id;
        newItem.template = DmsTree.template;

        DmsTree.emit("getFilters", function (filters) {

            newItem.filters = filters;

            var crudObj = {
                t: LIST_TEMPLATE_ID,
                q: {
                    _id: activeItem._id,
                     template: DmsTree.template
                },
                d: newItem
            };

            DmsTree.emit("update", crudObj, function (err) {

                closeModals();
                if (err) { return alert(err); }

                DmsTree.emit("refresh");
            });
        });
    };

    //////////////////////
    // Delete LIST
    //////////////////////
    DmsTree.deleteList = function () {

        var activeItems = DmsTree.getActive("item");
        if (!activeItems || !activeItems.length) { return alert("No list selected."); }

        var _ids = [];

        for (var i in activeItems) {
            _ids.push(activeItems[i]._id);
        }

        var finalIds = [];

        // read all subfolders and files
        (function readRecursive(id) {

            // all files and subfolders were scanned
            if (id.constructor === Array && !id.length) {

                // create the crud object
                var crudObj = {
                    t: LIST_TEMPLATE_ID,
                    q: {
                        _id: { $in: finalIds },
                        template: DmsTree.template
                    }
                };

                // and remove them
                DmsTree.emit("remove", crudObj, function (err) {

                    // close modals
                    closeModals();

                    // if an error appeared, show it
                    if (err) { return alert(err); }

                    // and slide up the lists and remove them from UI
                    DmsTree.getActive().slideUp(function () {
                        $(this).remove();
                    });
                });
            }

            // it's an array, read it!
            if (id.constructor === Array) {

                // id is an array, read recursive
                for (var i = 0; i < id.length; ++i) {

                    // get id to push
                    var idToPush = id[i]._id || id[i];

                    // push into the final ids array
                    finalIds.push(idToPush);

                    // read again
                    readRecursive(idToPush);
                }
                return;
            }

            // get the entire list object
            var list = storage[id];

            // it's a list object
            if (list.type === "folder") {

                // make the crud object
                var crudObj = {
                    t: LIST_TEMPLATE_ID,
                    q: {
                        parent: list._id,
                        template: DmsTree.template
                    }
                };

                // get subfolders and files
                DmsTree.emit("find", crudObj, function (err, data) {

                    // if an error appeared, show it
                    if (err) { return alert(err); }

                    // set data in storage
                    for (var i = 0; i < data.length; ++i) {
                        storage[data[i]._id] = data[i];
                    }

                    // read recursive
                    readRecursive(data);
                });
                return;
            }
        })(_ids);
    };

    ////////////////////////////
    // Drag and drop
    ///////////////////////////
    DmsTree.dragAndDrop = {
        over: function () {
            $(this).addClass("over");
        },
        out: function () {
            $(this).removeClass("over");
        },
        drop: function () {
            $(this).removeClass("over");
        }
    };

    //////////////////////
    // Set template
    //////////////////////
    DmsTree.setTemplate = function (newTemplate) {
        DmsTree.template = newTemplate._id;
        DmsTree.emit("templateSet", DmsTree.template);
    };

    function closeModals() {
        try {
            $(".modal").modal("hide");
        } catch (e) {}
    }

    DmsTree.emit("ready", config);
    DmsTree.on("refresh", function () {
        DmsTree.buildFrom(currentTemplate);
    });
};


return module; });
