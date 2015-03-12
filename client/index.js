// Dependencies
var $ = require("/libs/jquery");

/**
 * init
 *
 * @name init
 * @function
 * @return {undefined}
 */
exports.init = function() {
    var self = this;
    $(self._config.container).jstree({
        plugins: ["dnd", "types", "wholerow" ],
        types: {
            "default": {
                icon: "octicon octicon-file-text"
            },
            folder: {
                icon : "octicon octicon-file-directory"
            },
            binary: {
                icon : "octicon octicon-file-binary"
            },
            code: {
                icon : "octicon octicon-file-code"
            },
            media: {
                icon : "octicon octicon-file-media"
            },
            pdf: {
                icon : "octicon octicon-file-pdf"
            },
            symlink: {
                icon : "octicon octicon-file-symlink"
            },
            zip: {
                icon : "octicon octicon-file-zip"
            }
        },
        core: {
            data: [{
                text: "Root node",
                type: "folder",
                children: [{
                    text: "Child node 1",
                    type: "zip"
                }, {
                    text: "Child node 2",
                    type: "binary"
                }]
            }]
        }
    }).on("changed.jstree", function (e, data) {
        self.emit("changed", e, data);
    });
};

////////////// OLD
// module.exports = function(config) {
//
//     var DmsTree = this;
//     var ctrlDown = false;
//
//     var DRAGGABLE = {
//         revert: true,
//         zIndex: 2500,
//         start: function () {
//             var $this = $(this);
//             $this.effect("highlight", {}, 1000);
//             $this.css("cursor", "move");
//
//             if (!ctrlDown) {
//                 DmsTree.removeActive(".active");
//             }
//
//             DmsTree.setActive($this);
//         },
//         stop: function() {
//             $(this).css("cursor", "default");
//             $(".stack").css('z-index', '500');
//         }
//     };
//
//     var storage = {};
//     var currentTemplate;
//
//     $(document).on("keydown", function (e) {
//         if (e.keyCode === 17) {
//             ctrlDown = true;
//         }
//     }).on("keyup", function (e) {
//         if (e.keyCode === 17) {
//             ctrlDown = false;
//         }
//     });
//
//     ///////////////////
//     // HANDLERS
//     ///////////////////
//     // select a list
//     $(DmsTree.dom).on("click", ".list", function () {
//
//         // get item
//         var $item = $(this).closest("li");
//
//         // remove active
//         DmsTree.removeActive(".active");
//
//         // set the new active list
//         DmsTree.setActive($item);
//
//         // emit selection changed
//         DmsTree.emit("selectionChanged", DmsTree.getActive("item"));
//
//         // get the data item from storage object
//         var dataItem = storage[$item.attr("data-id")];
//
//         // get filters
//         var filters = dataItem.filters || [];
//
//         // set originalValue as value if it exists
//         for (var i = 0; i < filters.length; ++i) {
//             if (filters[i].hasOwnProperty("originalValue")) {
//                 filters[i].value = filters[i].originalValue;
//                 delete filters[i].originalValue;
//             }
//         }
//
//         // set filters (reset true) and fetch data
//         DmsTree.emit("setFilters", filters, true);
//
//         // prevent the default browser behavior
//         return false;
//     }).on("click", ".folder", function (e) {
//
//         var $item = $(this);
//         $item = $item.closest("li");
//
//         if (DmsTree.isLoading($item)) { return; }
//
//         var dataItem = storage[$item.attr("data-id")];
//
//         DmsTree.startLoading($item);
//         if (DmsTree.folderIsOpened($item)) {
//             DmsTree.collapse($item, function () {
//                 DmsTree.stopLoading($item);
//                 DmsTree.closeFolder($item);
//             });
//             return;
//         }
//
//         if (e.ctrlKey) {
//             DmsTree.setActive($item);
//             DmsTree.stopLoading($item);
//             return;
//         }
//
//         var crudObj = {
//             t: LIST_TEMPLATE_ID,
//             q: {
//                 parent: dataItem._id,
//                 template: DmsTree.template
//             },
//             o: {
//                 sort: [["type", -1]]
//             }
//         };
//
//         DmsTree.removeActive(".active");
//         DmsTree.setActive($item);
//
//         DmsTree.emit("find", crudObj, function (err, docs) {
//
//             if (err) {
//                 alert(err);
//                 return;
//             }
//
//             DmsTree.expand($item, docs, function () {
//                 DmsTree.stopLoading($item);
//                 DmsTree.openFolder($item);
//
//                 // emit selection changed
//                 DmsTree.emit("selectionChanged", DmsTree.getActive("item"));
//             });
//         });
//         return false;
//     }).on("click", ".all", function () {
//
//         DmsTree.removeActive(".active");
//         DmsTree.setActive($(this));
//
//         // emit selection changed
//         DmsTree.emit("selectionChanged", DmsTree.getActive("item"));
//
//         DmsTree.emit("setFilters", (storage[$(this).attr("id")] || {}).filters || [], true);
//         return false;
//     });
//
//     ///////////////////////////////
//     // Generate the tree from items
//     ///////////////////////////////
//     DmsTree.buildFrom = function (items) {
//
//         var $tree = $(".dms-tree", DmsTree.dom);
//         var $typeTemplates = $(".type-templates", DmsTree.dom);
//
//         switch (Object.prototype.toString.call(items)) {
//             // object
//             case "[object Object]":
//
//                 currentTemplate = items;
//
//                 var crudObj = {
//                     t: LIST_TEMPLATE_ID,
//                     q: {
//                         parent: { $exists: false },
//                         template: DmsTree.template
//                     },
//                     o: {
//                         sort: [["type", -1]]
//                     }
//                 };
//
//                 // -> emit -> bind-crud -> callback -> buildFrom Array
//                 DmsTree.emit("find", crudObj, function (err, docs) {
//                     if (err) {
//                         alert(err);
//                         return;
//                     }
//
//                     DmsTree.buildFrom(docs);
//                 });
//
//                 return;
//             // array
//             case "[object Array]":
//                 break;
//             // other type
//             default:
//                 return;
//         }
//
//         $tree.empty();
//
//         // count
//         crudObj = {
//             t: LIST_TEMPLATE_ID,
//             q: {
//                 type: { $ne: "folder" },
//                 template: DmsTree.template
//             },
//             f: { $none: 1, _id: 0 }
//         };
//
//         DmsTree.emit("find", crudObj, function (err, docs) {
//             if (err) {
//                 alert(err);
//                 return;
//             }
//
//             var $all = $(".all-template", $typeTemplates)
//                 .clone()
//                 .removeClass("all-template");
//
//             $(".all-value", $all).text(docs.length);
//             $tree.prepend($all);
//         });
//
//         // an empty array
//         if (!items || !items.length) { return; }
//
//         var $itemsToAppend = $("<div>");
//
//         for (var i in items) {
//             var item = items[i];
//             var $newItem = $("." + item.type + "-template", $typeTemplates).clone();
//
//             storage[item._id] = item;
//
//             $newItem
//                 .attr("data-id", item._id)
//                 .removeClass(item.type + "-template")
//                 .find(".name").text(item.name);
//
//             $itemsToAppend.append($newItem);
//         }
//
//         $itemsToAppend.find("li").draggable(DRAGGABLE);
//
//         $itemsToAppend.find(".folder").closest("li").droppable({
//             over: DmsTree.dragAndDrop.over,
//             out: DmsTree.dragAndDrop.out,
//             drop: DmsTree.dragAndDrop.drop
//         });
//
//         $tree.append($itemsToAppend);
//         $tree.find("li").hide().slideDown();
//     };
//
//
//     ///////////////////////////////
//     // Set active class
//     ///////////////////////////////
//     DmsTree.setActive = function (jQueryElement) {
//         jQueryElement = $(jQueryElement, DmsTree.dom);
//
//         if (ctrlDown && jQueryElement.hasClass("active")) {
//             jQueryElement.toggleClass("active");
//         }
//         else {
//             jQueryElement.addClass("active");
//         }
//     };
//
//     DmsTree.removeActive = function (jQueryElement) {
//
//         if (ctrlDown) { return; }
//
//         jQueryElement = $(jQueryElement, DmsTree.dom);
//         jQueryElement.removeClass("active");
//     };
//
//     //////////////////////////////
//     // Get active (item/element)
//     //////////////////////////////
//     DmsTree.getActive = function (item) {
//
//         var jQueryElements = $(DmsTree.dom).find(".active");
//         if (!jQueryElements.length) { return undefined; }
//
//         if (item === "item") {
//             var activeItems = [];
//
//             if (jQueryElements.length === 1) {
//                 activeItems.push(storage[jQueryElements.attr("data-id")]);
//                 return activeItems
//             }
//
//             jQueryElements.each(function () {
//                 activeItems.push(storage[$(this).attr("data-id")]);
//             })
//
//             return activeItems;
//         }
//
//         return jQueryElements;
//     };
//
//     ///////////////////////////////
//     // Open-Close functions
//     ///////////////////////////////
//     DmsTree.openFolder = function (jQueryElement) {
//
//         jQueryElement = $(jQueryElement, DmsTree.dom);
//         if (jQueryElement.attr("data-loading")) { return; }
//
//         var $openClose = jQueryElement.find(".open-close");
//
//         $openClose.children().first().addClass("hide");
//         $openClose.children().last().removeClass("hide");
//         jQueryElement.find(".chevron").toggleClass("icon-chevron-right icon-chevron-down");
//     };
//
//     DmsTree.closeFolder = function (jQueryElement) {
//         jQueryElement = $(jQueryElement, DmsTree.dom);
//         if (jQueryElement.attr("data-loading")) { return; }
//
//         var $openClose = jQueryElement.find(".open-close");
//
//         $openClose.children().last().addClass("hide");
//         $openClose.children().first().removeClass("hide");
//         jQueryElement.find(".chevron").toggleClass("icon-chevron-right icon-chevron-down");
//     };
//
//     DmsTree.folderIsOpened = function (jQueryElement) {
//         jQueryElement = $(jQueryElement, DmsTree.dom);
//         var $openClose = jQueryElement.find(".open-close");
//
//         if ($openClose.children().last().hasClass("hide")) { return false; }
//         return true;
//     };
//
//     ///////////////////////////////
//     // Loading functions
//     ///////////////////////////////
//     DmsTree.startLoading = function (jQueryElement) {
//         jQueryElement = $(jQueryElement, DmsTree.dom);
//         var $loading = jQueryElement.find(".loading-toggle");
//
//         $loading.children().first().removeClass("hide");
//         $loading.children().last().addClass("hide");
//         jQueryElement.attr("data-loading", "true");
//     };
//
//     DmsTree.stopLoading = function (jQueryElement) {
//         jQueryElement = $(jQueryElement, DmsTree.dom);
//         var $loading = jQueryElement.find(".loading-toggle");
//
//         $loading.children().first().addClass("hide");
//         var $last = $loading.children().last();
//         $last.removeClass("hide");
//         jQueryElement.attr("data-loading", "");
//     };
//
//     DmsTree.isLoading = function (jQueryElement) {
//         jQueryElement = $(jQueryElement, DmsTree.dom);
//         if (jQueryElement.attr("data-loading")) { return true; }
//         return false;
//     };
//
//     ////////////////////
//     // EXPAND / COLLAPSE
//     ////////////////////
//     DmsTree.expand = function (jQueryElement, docs, callback) {
//
//         callback = callback || function () {};
//
//         jQueryElement = $(jQueryElement, DmsTree.dom);
//
//         if (jQueryElement.next().prop("tagName") === "UL") { return; }
//
//         var $ul = $("<ul>");
//         for (var i in docs) {
//             var doc = docs[i];
//             storage[doc._id] = doc;
//
//             var templClass = doc.type + "-template";
//             var $newItem = $("." + templClass)
//                             .clone()
//                             .removeClass(templClass);
//
//             $newItem.attr("data-id", doc._id)
//                     .find(".name").text(doc.name);
//
//             $ul.append($newItem);
//         }
//
//         $ul.find("li").draggable(DRAGGABLE);
//
//         $(".folder", $ul).closest("li").droppable({
//             over: DmsTree.dragAndDrop.over,
//             out: DmsTree.dragAndDrop.out,
//             drop: DmsTree.dragAndDrop.drop
//         });
//
//         jQueryElement.after($ul);
//         $ul.hide().slideDown(callback);
//     };
//
//     DmsTree.collapse = function (jQueryElement, callback) {
//         jQueryElement = $(jQueryElement, DmsTree.dom);
//         var folderContent = jQueryElement.next();
//         folderContent.slideUp(function () {
//             folderContent.remove();
//             callback();
//         });
//     };
//
//
//     //////////////////////
//     // NEW LIST/NEW FOLDER
//     //////////////////////
//     DmsTree.newList = function (listObj, callback) {
//
//         // a template must be selected
//         if (!DmsTree.template || !currentTemplate) { return alert("Select a template, first."); }
//
//         // force callback to be a function
//         callback = callback || function () {};
//
//         // get filters
//         DmsTree.emit("getFilters", function (filters) {
//
//             // set filters
//             listObj.filters = filters;
//
//             // remove _li
//             for (var i = 0; i < listObj.filters.length; ++i) {
//                 if (listObj.filters[i].field === "_li") {
//                     listObj.filters.splice(i, 1);
//                 }
//             }
//
//             // set template
//             listObj.template = DmsTree.template;
//
//             // build crud object
//             var crudObj = {
//                 t: LIST_TEMPLATE_ID,
//                 d: listObj
//             };
//
//             // insert the object via crud
//             DmsTree.emit("insert", crudObj, function (err, insertedDoc) {
//
//                 // update UI
//                 closeModals();
//
//                 // handle error
//                 if (err) {
//                     callback(err);
//                     alert(err);
//                     return;
//                 }
//
//                 // inserted doc is probably an array
//                 insertedDoc = insertedDoc[0] || insertedDoc;
//
//                 // handle fixed lists
//                 if (insertedDoc.type === "fixed") {
//
//                     // build query
//                     var queryFromFilters = queryBuilder(filters);
//
//                     // build crud object
//                     var crudObj = {
//                         // the current template
//                         t: DmsTree.template,
//                         q: queryFromFilters,
//                         d: {
//                             $addToSet: { _li: insertedDoc._id }
//                         },
//                         o: { multi: true }
//                     };
//
//                     // update all items that match these filters
//                     DmsTree.emit("update", crudObj, function (err) {
//
//                         // handle error
//                         if (err) {
//                             callback(err);
//                             alert(err);
//                             return;
//                         }
//
//                         // build crud object
//                         var crudObj = {
//                             t: LIST_TEMPLATE_ID,
//                             q: { _id: insertedDoc._id },
//                             d: {
//                                 $set: {
//                                     filters: [
//                                         {
//                                             field: "_li",
//                                             operator: "=",
//                                             hidden: true,
//                                             value: insertedDoc._id
//                                         }
//                                     ]
//                                 }
//                             }
//                         };
//
//                         // update the inserted document (set _li)
//                         DmsTree.emit("update", crudObj, function (err) {
//
//                             // handle error
//                             if (err) {
//                                 callback(err);
//                                 alert(err);
//                                 return;
//                             }
//
//                             // callback something
//                             callback(err, insertedDoc);
//
//                             // refresh
//                             DmsTree.emit("refresh");
//                         });
//                     });
//
//                     return;
//                 }
//
//                 // callback something
//                 callback(err, insertedDoc);
//
//                 // refresh
//                 DmsTree.emit("refresh");
//             });
//         });
//     };
//
//     //////////////////////
//     // EDIT LIST
//     //////////////////////
//     DmsTree.editList = function (listObj, callback) {
//
//         // _id is required
//         if (!listObj._id) { return alert("Missing _id from listObj."); }
//
//         // set template field for the list
//         listObj.template = DmsTree.template;
//
//         // get filters
//         // DmsTree.emit("getFilters", function (filters) {
//
//         //     // set filters, if the list is filtered, if not, keep the old and single filter (_li)
//         //     if (listObj.type === "filtered") {
//         //         listObj.filters = filters;
//         //     }
//
//             // build the crud object
//             var crudObj = {
//                 t: LIST_TEMPLATE_ID,
//                 q: {
//                     _id: listObj._id,
//                     template: DmsTree.template
//                 },
//                 d: { $set: listObj }
//             };
//
//             // delete the _id, we don't need it after we
//             // set the crudObj query
//             delete listObj._id;
//
//             // update the list via crud
//             DmsTree.emit("update", crudObj, function (err) {
//
//                 // update UI (modals)
//                 closeModals();
//
//                 // handle error
//                 if (err) { return alert(err); }
//
//                 // and refresh the list
//                 DmsTree.emit("refresh");
//             });
//         // });
//     };
//
//     //////////////////////
//     // Delete LIST
//     //////////////////////
//     DmsTree.deleteList = function () {
//
//         var activeItems = DmsTree.getActive("item");
//         if (!activeItems || !activeItems.length) { return alert("No list selected."); }
//
//         var _ids = [];
//
//         for (var i in activeItems) {
//             _ids.push(activeItems[i]._id);
//         }
//
//         var finalIds = [];
//
//         // read all subfolders and files
//         (function readRecursive(id) {
//
//             // all files and subfolders were scanned
//             function deleteItem (itemId) {
//                 // create the crud object
//                 var crudObj = {
//                     t: LIST_TEMPLATE_ID,
//                     q: {
//                         _id: itemId,
//                         template: DmsTree.template
//                     }
//                 };
//
//                 // and remove them
//                 DmsTree.emit("remove", crudObj, function (err) {
//
//                     // close modals
//                     closeModals();
//
//                     // if an error appeared, show it
//                     if (err) { return alert(err); }
//
//                     // and slide up the lists and remove them from UI
//                     $("[data-id='" + itemId + "']", DmsTree.dom).slideUp(function () {
//                         $(this).remove();
//                     });
//                 });
//             }
//
//             // it's an array, read it!
//             if (id.constructor === Array) {
//
//                 // id is an array, read recursive
//                 for (var i = 0; i < id.length; ++i) {
//
//                     // get id to push
//                     var idToPush = id[i]._id || id[i];
//
//                     // delete item via crud
//                     deleteItem(idToPush);
//
//                     // read again
//                     readRecursive(idToPush);
//                 }
//
//                 return;
//             }
//
//             // get the entire list object
//             var list = storage[id];
//
//             // it's a list object
//             if (list.type === "folder") {
//
//                 // make the crud object
//                 var crudObj = {
//                     t: LIST_TEMPLATE_ID,
//                     q: {
//                         parent: list._id,
//                         template: DmsTree.template
//                     }
//                 };
//
//                 // get subfolders and files
//                 DmsTree.emit("find", crudObj, function (err, data) {
//
//                     // if an error appeared, show it
//                     if (err) { return alert(err); }
//
//                     // set data in storage
//                     for (var i = 0; i < data.length; ++i) {
//                         storage[data[i]._id] = data[i];
//                     }
//
//                     // read recursive
//                     readRecursive(data);
//                 });
//                 return;
//             } else {
//                 deleteItem(list._id);
//             }
//         })(_ids);
//     };
//
//     ////////////////////////////
//     // Drag and drop
//     ///////////////////////////
//     DmsTree.dragAndDrop = {
//         over: function () {
//             $(this).addClass("over");
//         },
//         out: function () {
//             $(this).removeClass("over");
//         },
//         drop: function () {
//             // remove class over
//             $(this).removeClass("over");
//
//             // get jQuery selected items (dropped items)
//             var $itemsToMove = DmsTree.getActive() || $(arguments[1].draggable);
//
//             // check for length
//             if (!$itemsToMove || !$itemsToMove.length) { return; }
//
//             // get the jQuery move target
//             var $moveTarget = $(this);
//
//             // get data item
//             var dataItem = storage[$moveTarget.attr("data-id")] || {};
//
//             // get data items (from storage) associated with these jQuery elements
//             var moveTargetId = dataItem._id;
//
//             // build a list of _ids that will be moved in the new folder
//             var itemsToMove = [];
//             for (var i = 0; i < $itemsToMove.length; ++i) {
//                 itemsToMove.push($($itemsToMove[i]).attr("data-id"));
//             }
//
//             // make the crud object
//             var crudObject = {
//                 q: { "_id": { "$in": itemsToMove }, "template": DmsTree.template },
//                 d: { "$set": { "parent": moveTargetId } },
//                 o: { "multi": true },
//                 t: LIST_TEMPLATE_ID
//             };
//
//             // move to root
//             if (!moveTargetId) {
//                 // delete $set
//                 delete crudObject.d["$set"];
//                 // unset parent
//                 crudObject.d["$unset"] = {"parent": ""}
//             }
//
//             var okToMove = true;
//             // verify if the list can be moved
//             itemsToMoveForLoop:
//             for (var i = 0; i < itemsToMove.length; ++i) {
//                 var cItemToMove = itemsToMove[i];
//                 var arrayOfParents = DmsTree.getParentsOf (dataItem);
//                 for (var ii = 0; ii < arrayOfParents.length; ++ii) {
//                     if (arrayOfParents[ii] === cItemToMove) {
//                         okToMove = false;
//                         break itemsToMoveForLoop;
//                     }
//                 }
//             }
//
//             if (!okToMove) {
//                 var err = new Error("Cannot move a folder in one of its subfolders.");
//                 DmsTree.emit("error", err);
//                 return;
//             }
//
//             // update the items (set parent as the new id)
//             DmsTree.emit("update", crudObject, function (err, data) {
//                 if (err) { return alert(err); }
//                 DmsTree.emit("refresh");
//             });
//         }
//     };
//
//     // move to root
//     $(".move-to-root").droppable({
//         over: DmsTree.dragAndDrop.over,
//         out:  DmsTree.dragAndDrop.out,
//         drop: DmsTree.dragAndDrop.drop
//     });
//
//     //////////////////////
//     // Set template
//     //////////////////////
//     DmsTree.setTemplate = function (e, template) {
//
//         if (e._id) { template = e; }
//
//         DmsTree.template = (template || {})._id;
//         DmsTree.emit("templateSet", DmsTree.template);
//     };
//
//     /*
//      *  This function will return an array with all parents
//      *  of a list/folder
//      * */
//     DmsTree.getParentsOf = function (dataItem, parents) {
//
//         // get parent of current list
//         var parentOfDataItem = dataItem.parent;
//
//         // no array, let's create it
//         parents = parents || [];
//
//         // no parent, it's root
//         if (!parentOfDataItem) {
//             return parents;
//         }
//
//         // push parent
//         parents.push(parentOfDataItem);
//
//         // recursive call
//         return DmsTree.getParentsOf(storage[parentOfDataItem], parents);
//     };
//
//     /*
//      *  This function set the filters for .all class inside of the module
//      * */
//     DmsTree.setFiltersForAllElement = function (filters) {
//
//         // generate a random id
//         var newId = Math.random().toString(36).substring(5, 10);
//
//         // get filters
//         var filtersOfAll;
//
//         // default value
//         filters = filters || [];
//
//         // if filters is an object
//         if (filters.constructor === Object) {
//
//             // empty filters of all
//             filtersOfAll = [];
//
//             // iterate the filters obj
//             for (var hash in filters) {
//                 if (!filters.hasOwnProperty(hash)) continue;
//
//                 // and push each filter
//                 filtersOfAll.push(filters[hash]);
//             }
//         } else {
//             filtersOfAll = filters;
//         }
//
//         // set the new id
//         $(".all", self.dom).attr("id", newId);
//
//         // store the new id
//         storage[newId] = {
//             filters: filtersOfAll
//         };
//
//         return filtersOfAll;
//     };
//
//     function closeModals() {
//         try {
//             $(".modal").modal("hide");
//         } catch (e) {}
//     }
//
//     DmsTree.emit("ready", config);
//     DmsTree.on("refresh", function () {
//         DmsTree.buildFrom(currentTemplate);
//     });
//
//     Events.call(DmsTree, config);
// };
