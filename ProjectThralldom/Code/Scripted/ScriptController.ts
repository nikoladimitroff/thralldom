module Thralldom {
    export class ScriptController {

        public finished: boolean;

        private sequence: Array<IScriptedAction>;
        private current: number;

        constructor(sequence: Array<IScriptedAction>) {
            this.sequence = sequence;
            this.finished = false;
        }

        public trigger(): void {
            this.current = 0;
            this.sequence[this.current].begin();
        }

        public update(character: Character, scene: Thralldom.Scene, delta: number): void {
            if (this.finished) {
                //return;
            }

            this.sequence[this.current].update(character, scene, delta);

            if (this.sequence[this.current].hasCompleted) {
                this.current++;

                if (this.current >= this.sequence.length) {
                    this.finished = true;
                    this.current--;
                }
                else {
                    this.sequence[this.current].begin();
                }
            }
        }
    }
} 