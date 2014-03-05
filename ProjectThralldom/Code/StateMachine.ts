module Thralldom {
    export class StateMachine {
        private currentState: number;
        private transitions: Array<Array<number>>;
        private transitionCallbacks: Array<(previous: number) => void>;
        private extraConditions: Array<(nextState: number) => boolean>;

        public get current() {
            return this.currentState;
        }

        constructor(transitions: Array<Array<number>>,
            extraConditions: Array<(nextState: number) => boolean>,
            onEntry: Array<(previous: number) => void>) {
            this.currentState = 0;
            this.transitions = transitions;
            this.transitionCallbacks = onEntry;
            this.extraConditions = extraConditions;
        }

        public requestTransitionTo(state: number): boolean {
            var canTransit =
                this.extraConditions[this.currentState](state) ||
                this.transitions[this.currentState].indexOf(state) != -1;

            if (canTransit) {
                var previous = this.currentState;
                this.currentState = state;
                this.transitionCallbacks[state](previous);
            }

            return canTransit;
        }
    }
} 