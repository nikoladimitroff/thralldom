module Thralldom {
    export module AI {
        export class AIController implements IController {
            public character: Character;
            public script: ScriptController;

            public currentRectangle: number;

            public path: Array<Algorithms.Rectangle>;
            public radiusSquared: number;

            constructor(character: Character, graph: Algorithms.IGraph) {
                var nodes = graph.nodes;

                var characterPos = character.mesh.position;

                this.currentRectangle = 0;

                this.path = [];

                this.character = character;

                var diffX = character.mesh.geometry.boundingBox.max.x - character.mesh.geometry.boundingBox.min.x;
                var diffZ = character.mesh.geometry.boundingBox.max.z - character.mesh.geometry.boundingBox.min.z;
                var radius = Math.max(diffX, diffZ) / 2 * character.mesh.scale.x;
                this.radiusSquared = radius * radius;
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