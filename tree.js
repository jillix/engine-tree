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
    // select a list
    $(DmsTree.dom).on("click", ".list", function () {

        // get item
        var $item = $(this).closest("li");

        // remove active
        DmsTree.removeActive("*");

        // set the new active list
        DmsTree.setActive($item);

        // get filters
        var filters = (storage[$item.attr("data-id")] || {}).filters || [];

        // set originalValue as value if it exists
        for (var i = 0; i < filters.length; ++i) {
            if (filters[i].hasOwnProperty("originalValue")) {
                filters[i].value = filters[i].originalValue;
                delete filters[i].originalValue;
            }
        }

        // setFilters event for bind-filter (reset: true)
        DmsTree.emit("setFilters", filters, true);

        // prevent the default browser behavior
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
                        template: DmsTree.template
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

        // a template must be selected
        // TODO Use DmsTree.template
        if (!currentTemplate) { return alert("Select a template, first."); }

        // force callback to be a function
        callback = callback || function () {};

        // get filters
        DmsTree.emit("getFilters", function (filters) {

            // set filters
            listObj.filters = filters;

            // set template
            listObj.template = DmsTree.template;

            // build crud object
            var crudObj = {
                t: LIST_TEMPLATE_ID,
                d: listObj
            };

            // insert the object via crud
            DmsTree.emit("insert", crudObj, function (err, insertedDoc) {

                // update UI
                closeModals();

                // handle error
                if (err) {
                    callback(err);
                    alert(err);
                    return;
                }

                // inserted doc is probably an array
                insertedDoc = insertedDoc[0] || insertedDoc;

                // handle fixed lists
                if (insertedDoc.type === "fixed") {

                    // build query
                    var queryFromFilters = queryBuilder(filters).q;

                    // build crud object
                    var crudObj = {
                        t: LIST_TEMPLATE_ID,
                        q: queryFromFilters,
                        // TODO Don't push duplicate values.
                        d: { $push: { _li: insertedDoc._id } }
                    };

                    // update all items that match these filters
                    DmsTree.emit("update", crudObj, function (err) {

                        // handle error
                        if (err) {
                            callback(err);
                            alert(err);
                            return;
                        }

                        // build crud object
                        var crudObj = {
                            t: LIST_TEMPLATE_ID,
                            q: { _id: insertedDoc._id },
                            d: { $set: { _li: insertedDoc._id } }
                        };

                        // update the inserted document (set _li)
                        DmsTree.emit("update", crudObj, function (err) {

                            // handle error
                            if (err) {
                                callback(err);
                                alert(err);
                                return;
                            }

                            // callback something
                            callback(err, insertedDoc);

                            // refresh
                            DmsTree.emit("refresh");
                        });
                    });

                    return;
                }

                // callback something
                callback(err, insertedDoc);

                // refresh
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
            function deleteItem (itemId) {
                // create the crud object
                var crudObj = {
                    t: LIST_TEMPLATE_ID,
                    q: {
                        _id: itemId,
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
                    $("[data-id='" + itemId + "']", DmsTree.dom).slideUp(function () {
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

                    // delete item via crud
                    deleteItem(idToPush);

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
            } else {
                deleteItem(list._id);
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
            // remove class over
            $(this).removeClass("over");

            // get jQuery selected items (dropped items)
            var $itemsToMove = DmsTree.getActive() || $(arguments[1].draggable);

            // TODO Is the target a subfolder of dragged folder?

            // check for length
            if (!$itemsToMove || !$itemsToMove.length) { return; }

            // get the jQuery move target
            var $moveTarget = $(this);

            // get data items (from storage) associated with these jQuery elements
            var moveTargetId = storage[$moveTarget.attr("data-id")]._id;

            // build a list of _ids that will be moved in the new folder
            var itemsToMove = [];
            for (var i = 0; i < $itemsToMove.length; ++i) {
                itemsToMove.push($($itemsToMove[i]).attr("data-id"));
            }

            // make the crud object
            var crudObject = {
                q: { "_id": { "$in": itemsToMove }, "template": DmsTree.template },
                d: { "$set": { "parent": moveTargetId } },
                o: { "multi": true },
                t: LIST_TEMPLATE_ID
            };

            // update the items (set parent as the new id)
            DmsTree.emit("update", crudObject, function (err, data) {
                if (err) { return alert(err); }
                DmsTree.emit("refresh");
            });
        }
    };

    //////////////////////
    // Set template
    //////////////////////
    DmsTree.setTemplate = function (e, template) {

        if (e._id) { template = e; }

        DmsTree.template = (template || {})._id;
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

// TODO Use bind-filter
function queryBuilder (filters) {

    var operatorConfig = {
        '=':        ['',        'mixed'],                                       // or
        '!=':       ['$ne',     ['number', 'string', 'array']],                 // and
        '>':        ['$gt',     ['number']],                                    // and
        '<':        ['$lt',     ['number']],                                    // and
        '>=':       ['$gte',    ['number']],                                    // and
        '<=':       ['$lte',    ['number']],                                    // and
        'in':       ['$in',     ['number', 'string', 'array'],    'split'],     // and ('or' can be achieved by concatenating the arrays)
        'notin':    ['$nin',    ['number', 'string', 'array'],    'split'],     // or ('and' can be achieved by concatenating the arrays)
        'all':      ['$all',    ['array'],    'split'],                         // or ('and' can be achieved by concatenating the arrays)
        'regExp':   ['$regex',  ['string']],                                    // and ('or' is built in the regex syntax)
        'exists':   ['$exists', 'mixed',    'boolean']                          // makes no sense
    };

    var query = {};
    var fieldsInQuery = {};

    for (filter in filters) {
        if (!filters.hasOwnProperty(filter)) continue;

        if (!filters[filter].disabled && operatorConfig[filters[filter].operator]) {

            var expression = {};
            var values = filters[filter];
            var value = values.value;
            var operator = operatorConfig[values.operator];

            // handle operators
            if (operator[0]) {
                expression[values.field] = {};
                expression[values.field][operator[0]] = value;
            } else {
                expression[values.field] = value;
            }

            // handle or
            if (fieldsInQuery[values.field]) {
                if (operator[0] === '') {
                    // create or array and move the existing expression to the array
                    if (!query.$or) {
                        query.$or = [{}];
                        query.$or[0][values.field] = query[values.field];
                        delete query[values.field];
                    }
                    query.$or.push(expression);
                } else {
                    query[values.field][operator[0]] = value;
                }
            } else {
                query[values.field] = expression[values.field];
            }

            fieldsInQuery[values.field] = 1;
        }
    }

    return query;
}

return module; });
