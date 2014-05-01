module Thralldom {
    export module AI {
        export class Statue extends AIController {

            constructor(character: Character, graph: Algorithms.IGraph) {
                super(character, graph);
            }

            public updateCallback(delta: number, world: Thralldom.World): void {
                this.character.stateMachine.requestTransitionTo(CharacterStates.Idle);
            }
        }
    }
}  