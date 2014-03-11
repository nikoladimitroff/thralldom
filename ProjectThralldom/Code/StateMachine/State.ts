module Thralldom {
    export class State {
        public index: number;
        public onEntry: (previous: number, object: DynamicObject) => void;
        public onExit: (next: number, object: DynamicObject) => void;
        public interuptCondition: (object: DynamicObject) => boolean;
        public entranceCondition: (object: DynamicObject) => boolean;
        public data: any;

        private static truthPredicate = (object: DynamicObject) => true;
        
        constructor(index: number,
            onEntry: (previous: number, object: DynamicObject) => void,
            onExit: (next: number, object: DynamicObject) => void,
            interuptCondition: (object: DynamicObject) => boolean,
            entranceCondition: (object: DynamicObject) => boolean = State.truthPredicate) {

            this.index = index;
            this.onEntry = onEntry;
            this.onExit = onExit;
            this.interuptCondition = interuptCondition;
            this.entranceCondition = entranceCondition;

            this.data = {};
        }
    }
}