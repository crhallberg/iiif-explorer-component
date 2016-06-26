namespace MyComponents {
    export class ExampleComponent extends Components.BaseComponent {

        constructor(options: IExampleComponentOptions) {
            super(options);
            
            this._init();
            this._resize();
        }

        public test(): void {
            this._emit(ExampleComponent.Events.TEST, [1, 2, 'three']);
        }

        protected _init(): boolean {
            var success: boolean = super._init();

            if (!success){
                console.error("Component failed to initialise");
            }
            
            this._$element.append("I am an example component");

            return success;
        }
        
        protected _getDefaultOptions(): IExampleComponentOptions {
            return <IExampleComponentOptions>{
            }
        }
        
        protected _resize(): void {
            
        }
    }
}

namespace MyComponents.ExampleComponent {
    export class Events {
        static TEST: string = 'test';
    }
}

(function(w) {
    if (!w.MyComponents){
        w.MyComponents = MyComponents;
    } else {
        w.MyComponents.ExampleComponent = MyComponents.ExampleComponent;
    }
})(window);