// iiif-explorer-component v1.0.1 https://github.com/edsilv/iiif-explorer-component#readme
declare namespace IIIFComponents {
    class ExplorerComponent extends Components.BaseComponent {
        constructor(options: IExplorerComponentOptions);
        test(): void;
        protected _init(): boolean;
        protected _getDefaultOptions(): IExplorerComponentOptions;
        protected _resize(): void;
    }
}
declare namespace IIIFComponents.ExplorerComponent {
    class Events {
        static TEST: string;
    }
}

declare namespace IIIFComponents {
    interface IExplorerComponentOptions extends Components.IBaseComponentOptions {
    }
}
