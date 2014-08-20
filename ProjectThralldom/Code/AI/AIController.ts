module Thralldom {
    export module AI {
        export class AIController implements IController {
            public character: Character;
            public script: ScriptController;

            public currentRectangle: number;

            public path: Array<Algorithms.Rectangle>;
            constructor(character: Character, graph: Algorithms.IGraph) {
                var nodes = graph.nodes;

                var characterPos = character.mesh.position;

                this.currentRectangle = 0;

                this.path = [];

                this.character = character;
            }

            public update(delta: number, world: Thralldom.World): void {
                if (this.character.isDead) {
                    this.character.stateMachine.requestTransitionTo(CharacterStates.Dying);
                }
                else {
                    if (this.script) {
                        this.script.update(this.character, world, delta);
                    }
                    else {
                        this.updateCallback(delta, world);
                    }

                    this.character.stateMachine.requestTransitionTo(CharacterStates.Falling);
                    this.character.stateMachine.requestTransitionTo(CharacterStates.Idle);
                }
                this.character.stateMachine.update(delta);
            }

            public updateCallback(delta: number, world: Thralldom.World): void {

            }
        }
    }
} 