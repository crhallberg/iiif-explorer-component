namespace IIIFComponents {
    export class ExplorerComponent extends Components.BaseComponent {

        constructor(options: IExplorerComponentOptions) {
            super(options);
            
            this._init();
            this._resize();
        }

        public test(): void {
            this._emit(ExplorerComponent.Events.TEST, [1, 2, 'three']);
        }

        protected _init(): boolean {
            var success: boolean = super._init();

            if (!success){
                console.error("Component failed to initialise");
            }
            
            this._$element.append("I am an explorer component");

            return success;
        }
        
        protected _getDefaultOptions(): IExplorerComponentOptions {
            return <IExplorerComponentOptions>{
            }
        }
        
        protected _resize(): void {
            
        }
    }
}

namespace IIIFComponents.ExplorerComponent {
    export class Events {
        static TEST: string = 'test';
    }
}

(function(w) {
    if (!w.IIIFComponents){
        w.IIIFComponents = IIIFComponents;
    } else {
        w.IIIFComponents.ExplorerComponent = IIIFComponents.ExplorerComponent;
    }
})(window);