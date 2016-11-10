namespace IIIFComponents {
    export class ExplorerComponent extends _Components.BaseComponent {

        public options: IExplorerComponentOptions;
        private _$view: JQuery;
        private _selected: Manifesto.IIIFResource;
        private _current: Manifesto.IIIFResource;
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
                breadcrumbTemplate: '<div class="explorer-breadcrumb explorer-item">\
                                        <a class="explorer-breadcrumb-link explorer-link" href="{{>id}}" title="{{>label}}">{{>label}}</a>\
                                    </div>',
                itemTemplate:  '{{if getIIIFResourceType().value === "sc:collection"}}\
                                    <div class="explorer-folder {{:~itemClass(id)}}">\
                                        <a class="explorer-folder-link explorer-link" href="{{>id}}" title="{{>label}}">\
                                            {{>label}}\
                                        </a>\
                                {{else}}\
                                    <div class="explorer-resource {{:~itemClass(id)}}">\
                                        <a class="explorer-item-link explorer-link" href="{{>id}}" title="{{>label}}">\
                                            {{>label}}\
                                        </a>\
                                {{/if}}\
                                </div>'
            });

            $.views.helpers({
                  itemClass: function(id) {
                      return id === this._selected.id
                          ? 'explorer-item selected'
                          : 'explorer-item';
                  }.bind(this)
            });

            $.views.tags({
                breadcrumb: {
                    init: function (tagCtx, linkCtx, ctx) {
                        this.data = tagCtx.view.data;
                        this.data.label = Manifesto.TranslationCollection.getValue(this.data.getLabel());
                    },
                    onAfterLink: function () {
                        var self: any = this;

                        self.contents('.explorer-breadcrumb')
                            .on('click', 'a.explorer-breadcrumb-link', function() {
                                that.gotoBreadcrumb(self.data);
                                return false;
                            });
                    },
                    template: $.templates.breadcrumbTemplate
                },
                item: {
                    init: function (tagCtx, linkCtx, ctx) {
                        this.data = tagCtx.view.data;
                        this.data.label = Manifesto.TranslationCollection.getValue(this.data.getLabel());
                    },
                    onAfterLink: function () {
                        var self: any = this;

                        self.contents('.explorer-item')
                            .on('click', 'a.explorer-folder-link', function() {
                                that._switchToFolder(self.data);
                                return false;
                            })
                            .on('click', 'a.explorer-item-link', function() {
                                that._selected = self.data;
                                that._draw();
                                that._emit(ExplorerComponent.Events.EXPLORER_NODE_SELECTED, self.data);
                                return false;
                            });
                    },
                    template: $.templates.itemTemplate
                }
            });

            return success;
        }

        protected _draw(): void {
            let data = { parents: this._parents, current: this._current, selected: '' };
            if (this._selected) {
              data.selected = this._selected.id;
            }
            this._$view.link($.templates.pageTemplate, data);
        }

        protected _sortCollectionsFirst(a: Manifesto.IIIFResource, b: Manifesto.IIIFResource): number {
            let aType = a.getIIIFResourceType().value;
            let bType = b.getIIIFResourceType().value;
            if (aType === bType) {
                // Alphabetical
                let aLabel = Manifesto.TranslationCollection.getValue(a.getLabel());
                let bLabel = Manifesto.TranslationCollection.getValue(b.getLabel());
                return aLabel < bLabel ? -1 : 1;
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
            if (!node.isLoaded) {
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
                let url: any = node.getProperty('within');
                if ($.isArray(url)) { // TODO: Handle multiple within values
                    resolve([]);
                }
                let that: any = this;
                Manifesto.Utils.loadResource(url)
                    .then(function (parent:any) {
                      let parentManifest = manifesto.create(parent);
                      if (parentManifest.getProperty('within')) {
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
            if (root.getProperty('within')) {
                let that = this;
                this._followWithin(root).then(function (parents: Manifesto.IIIFResource[]) {
                    that._parents = parents;
                    let start = parents.pop();
                    while (!start.isCollection()) {
                        start = parents.pop();
                    }
                    that._switchToFolder(<Manifesto.Collection>start);
                });
            }
            if (root.isCollection()) {
                this._switchToFolder(<Manifesto.Collection>root);
            } else {
                this._selected = root;
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