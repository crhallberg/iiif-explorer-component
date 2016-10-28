namespace IIIFComponents {
    export class ExplorerComponent extends _Components.BaseComponent {

        public options: IExplorerComponentOptions;
        private _$view: JQuery;
        private _current: Manifold.ITreeNode
        private _parents: Manifold.ITreeNode[] = [];

        constructor(options: IExplorerComponentOptions) {
            super(options);

            this._init();
            this._resize();
        }

        protected _init(): boolean {
            var success: boolean = super._init();

            if (!success){
                console.error("Component failed to initialise");
            }

            var that = this;

            this._$view = $('<div class="explorer-view"></div>');
            this._$element.empty();
            this._$element.append(this._$view);

            $.templates({
                pageTemplate:   '<div class="breadcrumbs">\
                                    {^{for parents}}\
                                        {^{breadcrumb/}}\
                                    {{/for}}\
                                </div>\
                                <hr/>\
                                <div class="items">\
                                    {^{for current.nodes}}\
                                        {^{item/}}\
                                    {{/for}}\
                                </div>',
                breadcrumbTemplate: '<div class="explorer-breadcrumb">\
                                        <i class="fa fa-caret-down"></i>\
                                        <i class="fa fa-folder-open-o"></i>\
                                        <a id="breadcrumb-link-{{>id}}" class="explorer-breadcrumb-link" href="#" title="{{>label}}">{{>label}}</a>\
                                    </div>',
                itemTemplate:   '<div class="explorer-item">\
                                    {{if data.type === "sc:collection"}}\
                                        <i class="fa fa-folder"></i>\
                                        <a id="item-link-{{>id}}" class="explorer-folder-link" href="#" title="{{>label}}">{{>label}}</a>\
                                    {{/if}}\
                                    {{if data.type === "sc:manifest"}}\
                                        <i class="fa fa-file-text-o"></i>\
                                        <a id="item-link-{{>id}}" class="explorer-item-link" href="#" title="{{>label}}">{{>label}}</a>\
                                    {{/if}}\
                                </div>'
            });

            $.views.tags({
                breadcrumb: {
                    init: function (tagCtx, linkCtx, ctx) {
                        this.data = tagCtx.view.data;
                    },
                    onAfterLink: function () {
                        var self: any = this;

                        self.contents('.explorer-breadcrumb')
                            .on('click', 'a.explorer-breadcrumb-link', function() {
                                that.gotoBreadcrumb(self.data);
                            });
                    },
                    template: $.templates.breadcrumbTemplate
                },
                item: {
                    init: function (tagCtx, linkCtx, ctx) {
                        this.data = tagCtx.view.data;
                        this.data.parents
                    },
                    onAfterLink: function () {
                        var self: any = this;

                        self.contents('.explorer-item')
                            .on('click', 'a.explorer-folder-link', function() {
                                that.openFolder(self.data);
                            })
                            .on('click', 'a.explorer-item-link', function() {
                                that._emit(ExplorerComponent.Events.EXPLORER_NODE_SELECTED, self.data);
                            });
                    },
                    template: $.templates.itemTemplate
                }
            });

            return success;
        }

        protected _draw(): void {
            this._$view.link($.templates.pageTemplate, { parents: this._parents, current: this._current });
        }

        protected _sortCollectionsFirst(a: Manifold.ITreeNode, b: Manifold.ITreeNode): number {
            if (a.data.type === b.data.type) {
                // Alphabetical
                return a.label < b.label ? -1 : 1;
            }
            // Collections first
            return b.data.type.indexOf('collection') - a.data.type.indexOf('collection');
        }

        public gotoBreadcrumb(node: Manifold.ITreeNode): void {
            let index: number = this._parents.indexOf(node);
            this._current = this._parents[index];
            this._parents = this._parents.slice(0, index + 1);
            this._draw();
        }

        protected _switchToFolder(node: Manifold.ITreeNode): void {
            node.nodes.sort(this._sortCollectionsFirst);
            this._parents.push(node);
            this._current = node;
            this._draw();
        }

        public openFolder(node: Manifold.ITreeNode): void {
            if (!node.data.isLoaded) {
                let that = this;
                node.data.load().then(function (collection: Manifesto.Collection): void {
                    console.log(collection);
                    node.nodes = collection.members.map(function (op: Manifesto.IIIFResource): Manifesto.TreeNode {
                        // TODO: OFFICIAL CONVERSION MUST EXIST
                        let data: any = op;
                        data.type = op.__jsonld['@type'].toLowerCase();
                        let treeNode: Manifesto.TreeNode = new Manifesto.TreeNode(op.__jsonld.label, data);
                        treeNode.parentNode = node;
                        return treeNode;
                    });
                    that._switchToFolder(node);
                });
            } else {
                this._switchToFolder(node);
            }
        }

        public databind(): void {
            let root: Manifold.ITreeNode = this.options.helper.getTree(this.options.topRangeIndex, this.options.treeSortType);
            root.nodes.sort(this._sortCollectionsFirst);
            console.log(root);
            this._parents.push(root);
            this._current = root;
            this._draw();
        }

        protected _getDefaultOptions(): IExplorerComponentOptions {
            return <IExplorerComponentOptions>{
                helper: null,
                topRangeIndex: 0,
                treeSortType: Manifold.TreeSortType.NONE
            }
        }

        protected _resize(): void {

        }
    }
}

namespace IIIFComponents.ExplorerComponent {
    export class Events {
        static TEST: string = 'test';
        static EXPLORER_NODE_SELECTED: string = 'explorerNodeSelected';
    }
}

(function(w) {
    if (!w.IIIFComponents){
        w.IIIFComponents = IIIFComponents;
    } else {
        w.IIIFComponents.ExplorerComponent = IIIFComponents.ExplorerComponent;
    }
})(window);