namespace IIIFComponents {
    export class ExplorerComponent extends _Components.BaseComponent {

        public options: IExplorerComponentOptions;
        private _$view: JQuery;
        private _current: Manifesto.IIIFResource
        private _parents: Manifesto.IIIFResource[] = [];

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
                                    {^{for current.members}}\
                                        {^{item/}}\
                                    {{/for}}\
                                </div>',
                breadcrumbTemplate: '<div class="explorer-breadcrumb">\
                                        <i class="fa fa-folder-open-o"></i>\
                                        <a id="breadcrumb-link-{{>id}}" class="explorer-breadcrumb-link" href="#" title="{{>__jsonld.label}}">{{>__jsonld.label}}</a>\
                                    </div>',
                itemTemplate:   '<div class="explorer-item">\
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
                    },
                    onAfterLink: function () {
                        var self: any = this;

                        self.contents('.explorer-item')
                            .on('click', 'a.explorer-folder-link', function() {
                                that._switchToFolder(self.data);
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
            console.log(this._current);
            this._$view.link($.templates.pageTemplate, { parents: this._parents, current: this._current });
        }

        protected _sortCollectionsFirst(a: Manifesto.IIIFResource, b: Manifesto.IIIFResource): number {
            let aType = a.getIIIFResourceType().value;
            let bType = b.getIIIFResourceType().value;
            if (aType === bType) {
                // Alphabetical
                return a.__jsonld.label < b.__jsonld.label ? -1 : 1;
            }
            // Collections first
            return bType.indexOf('collection') - aType.indexOf('collection');
        }

        public gotoBreadcrumb(node: Manifesto.Collection): void {
            let index: number = this._parents.indexOf(node);
            this._current = this._parents[index];
            this._parents = this._parents.slice(0, index + 1);
            this._draw();
        }

        protected _switchToFolder(node: Manifesto.Collection): void {
            if (!node.members.length) {
                node.load().then(this._switchToFolder.bind(this));
            } else {
                node.members.sort(this._sortCollectionsFirst);
                this._parents.push(node);
                this._current = node;
                this._draw();
            }
        }

        protected _followWithin(node: Manifesto.IIIFResource): Promise<Manifesto.IIIFResource[]> {
            return new Promise<any>((resolve, reject) => {
                let url: any = node.__jsonld.within;
                if ($.isArray(url)) { // TODO: Handle arrays
                    resolve([]);
                }
                let that: any = this;
                Manifesto.Utils.loadResource(url)
                    .then(function (parent:any) {
                      let parentManifest = manifesto.create(parent);
                      console.log('manifest', parentManifest);
                      if (typeof parentManifest.__jsonld.within !== 'undefined') {
                          that._followWithin(parentManifest).then(function(array: Manifesto.IIIFResource[]) {
                              array.push(node);
                              resolve(array);
                          });
                      } else {
                          resolve([parentManifest, node]);
                      }
                    }).catch(reject);
            });
        }

        public databind(): void {
            let root: Manifesto.IIIFResource = this.options.helper.iiifResource;
            console.log('root', root);
            if (typeof root.__jsonld.within !== 'undefined') {
                let that = this;
                this._followWithin(root).then(function (parents: Manifesto.IIIFResource[]) {
                    that._parents = parents;
                    if (root.isCollection()) {
                        that._switchToFolder(<Manifesto.Collection>parents.pop());
                    } else {
                        that._draw();
                    }
                });
            }
            console.log('r.iC()', root.isCollection());
            if (root.isCollection()) {
                this._switchToFolder(<Manifesto.Collection>root);
            }
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