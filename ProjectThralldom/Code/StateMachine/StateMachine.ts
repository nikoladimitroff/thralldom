module Thralldom {
    export class StateMachine {
        private currentState: number;
        private transitions: Array<Array<number>>;
        private target: DynamicObject;

        public states: Array<State>;
        public get current() {
            return this.currentState;
        }

        constructor(states: Array<State>, transitions: Array<Array<number>>, target: DynamicObject) {
            this.currentState = 0;
            this.transitions = transitions;
            this.states = states;

            this.target = target;
        }

        public requestTransitionTo(nextState: number): boolean {
            var canTransit =
                this.states[this.currentState].interuptCondition(this.target) ||
                this.transitions[this.currentState].indexOf(nextState) != -1;

            if (canTransit) {
                var previous = this.currentState;
                this.currentState = nextState;
                this.states[this.currentState].onEntry(previous, this.target);
                this.states[previous].onExit(this.currentState, this.target);
            }

            return canTransit;
        }
    }
} 