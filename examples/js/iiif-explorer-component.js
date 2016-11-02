// iiif-explorer-component v1.0.1 https://github.com/viewdir/iiif-explorer-component#readme
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.iiifExplorerComponent = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var IIIFComponents;
(function (IIIFComponents) {
    var ExplorerComponent = (function (_super) {
        __extends(ExplorerComponent, _super);
        function ExplorerComponent(options) {
            _super.call(this, options);
            this._parents = [];
            this._init();
            this._resize();
        }
        ExplorerComponent.prototype._init = function () {
            var success = _super.prototype._init.call(this);
            if (!success) {
                console.error("Component failed to initialise");
            }
            var that = this;
            this._$view = $('<div class="explorer-view"></div>');
            this._$element.empty();
            this._$element.append(this._$view);
            $.templates({
                pageTemplate: '<div class="breadcrumbs">\
                                    {^{for parents}}\
                                        {^{breadcrumb/}}\
                                    {{/for}}\
                                </div>\
                                <hr/>\
                                <div class="items">\
                                    {^{for current.members}}\
                                        {^{item/}}\
                                    {{/for}}\
                                </div>',
                breadcrumbTemplate: '<div class="explorer-breadcrumb">\
                                        <i class="fa fa-folder-open-o"></i>\
                                        <a id="breadcrumb-link-{{>id}}" class="explorer-breadcrumb-link" href="#" title="{{>__jsonld.label}}">{{>__jsonld.label}}</a>\
                                    </div>',
                itemTemplate: '<div class="explorer-item">\
                                    {{if getIIIFResourceType().value === "sc:collection"}}\
                                        <i class="fa fa-folder"></i>\
                                        <a id="folder-link-{{>id}}" class="explorer-folder-link" href="#" title="{{>__jsonld.label}}">\
                                            {{>__jsonld.label}}\
                                        </a>\
                                    {{else}}\
                                        <i class="fa fa-file-text-o"></i>\
                                        <a id="item-link-{{>id}}" class="explorer-item-link" href="#" title="{{>__jsonld.label}}">\
                                            {{>__jsonld.label}}\
                                        </a>\
                                    {{/if}}\
                                </div>'
            });
            $.views.tags({
                breadcrumb: {
                    init: function (tagCtx, linkCtx, ctx) {
                        this.data = tagCtx.view.data;
                    },
                    onAfterLink: function () {
                        var self = this;
                        self.contents('.explorer-breadcrumb')
                            .on('click', 'a.explorer-breadcrumb-link', function () {
                            that.gotoBreadcrumb(self.data);
                        });
                    },
                    template: $.templates.breadcrumbTemplate
                },
                item: {
                    init: function (tagCtx, linkCtx, ctx) {
                        this.data = tagCtx.view.data;
                    },
                    onAfterLink: function () {
                        var self = this;
                        self.contents('.explorer-item')
                            .on('click', 'a.explorer-folder-link', function () {
                            that._switchToFolder(self.data);
                        })
                            .on('click', 'a.explorer-item-link', function () {
                            that._emit(ExplorerComponent.Events.EXPLORER_NODE_SELECTED, self.data);
                        });
                    },
                    template: $.templates.itemTemplate
                }
            });
            return success;
        };
        ExplorerComponent.prototype._draw = function () {
            console.log(this._current);
            this._$view.link($.templates.pageTemplate, { parents: this._parents, current: this._current });
        };
        ExplorerComponent.prototype._sortCollectionsFirst = function (a, b) {
            var aType = a.getIIIFResourceType().value;
            var bType = b.getIIIFResourceType().value;
            if (aType === bType) {
                // Alphabetical
                return a.__jsonld.label < b.__jsonld.label ? -1 : 1;
            }
            // Collections first
            return bType.indexOf('collection') - aType.indexOf('collection');
        };
        ExplorerComponent.prototype.gotoBreadcrumb = function (node) {
            var index = this._parents.indexOf(node);
            this._current = this._parents[index];
            this._parents = this._parents.slice(0, index + 1);
            this._draw();
        };
        ExplorerComponent.prototype._switchToFolder = function (node) {
            if (!node.members.length) {
                node.load().then(this._switchToFolder.bind(this));
            }
            else {
                node.members.sort(this._sortCollectionsFirst);
                this._parents.push(node);
                this._current = node;
                this._draw();
            }
        };
        ExplorerComponent.prototype._followWithin = function (node) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                var url = node.__jsonld.within;
                if ($.isArray(url)) {
                    resolve([]);
                }
                var that = _this;
                Manifesto.Utils.loadResource(url)
                    .then(function (parent) {
                    var parentManifest = manifesto.create(parent);
                    if (typeof parentManifest.__jsonld.within !== 'undefined') {
                        that._followWithin(parentManifest).then(function (array) {
                            array.push(node);
                            resolve(array);
                        });
                    }
                    else {
                        resolve([parentManifest, node]);
                    }
                }).catch(reject);
            });
        };
        ExplorerComponent.prototype.databind = function () {
            var root = this.options.helper.iiifResource;
            if (typeof root.__jsonld.within !== 'undefined') {
                var that_1 = this;
                this._followWithin(root).then(function (parents) {
                    that_1._parents = parents;
                    var start = parents.pop();
                    while (!start.isCollection()) {
                        start = parents.pop();
                    }
                    that_1._switchToFolder(start);
                });
            }
            else if (root.isCollection()) {
                this._switchToFolder(root);
            }
        };
        ExplorerComponent.prototype._getDefaultOptions = function () {
            return {
                helper: null,
                topRangeIndex: 0,
                treeSortType: Manifold.TreeSortType.NONE
            };
        };
        ExplorerComponent.prototype._resize = function () {
        };
        return ExplorerComponent;
    }(_Components.BaseComponent));
    IIIFComponents.ExplorerComponent = ExplorerComponent;
})(IIIFComponents || (IIIFComponents = {}));
var IIIFComponents;
(function (IIIFComponents) {
    var ExplorerComponent;
    (function (ExplorerComponent) {
        var Events = (function () {
            function Events() {
            }
            Events.TEST = 'test';
            Events.EXPLORER_NODE_SELECTED = 'explorerNodeSelected';
            return Events;
        }());
        ExplorerComponent.Events = Events;
    })(ExplorerComponent = IIIFComponents.ExplorerComponent || (IIIFComponents.ExplorerComponent = {}));
})(IIIFComponents || (IIIFComponents = {}));
(function (w) {
    if (!w.IIIFComponents) {
        w.IIIFComponents = IIIFComponents;
    }
    else {
        w.IIIFComponents.ExplorerComponent = IIIFComponents.ExplorerComponent;
    }
})(window);



},{}]},{},[1])(1)
});