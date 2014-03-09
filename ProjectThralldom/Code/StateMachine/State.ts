module Thralldom {
    export class State {
        public index: number;
        public onEntry: (previous: number, object: DynamicObject) => void;
        public onExit: (next: number, object: DynamicObject) => void;
        public interuptCondition: (object: DynamicObject) => boolean;
        public data: any;

        constructor(index: number,
            onEntry: (previous: number, object: DynamicObject) => void,
            onExit: (next: number, object: DynamicObject) => void,
            interuptCondition: (object: DynamicObject) => boolean) {
            this.index = index;
            this.onEntry = onEntry;
            this.onExit = onExit;
            this.interuptCondition = interuptCondition;

            this.data = {};
        }
    }
}