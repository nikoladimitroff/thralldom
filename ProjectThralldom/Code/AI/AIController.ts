module Thralldom {
    export module AI {
        export class AIController implements IController {

            public character: Character;
            public script: ScriptController;
            public graph: Algorithms.IGraph;
            public path: Array<Algorithms.Vertex>;
            public currentNode: number;

            constructor(character: Character, graph: Algorithms.IGraph) {
                var nodes = graph.nodes;

                var characterPos = character.mesh.position;
                var min = nodes[0],
                    minDist = (min.x - characterPos.x) * (min.x - characterPos.x) +
                              (min.y - characterPos.z) * (min.y - characterPos.z)
                for (var i = 1; i < nodes.length; i++) {
                    var dist = (nodes[i].x - characterPos.x) * (nodes[i].x - characterPos.x) +
                               (nodes[i].y - characterPos.z) * (nodes[i].y - characterPos.z);

                    if (dist < minDist) {
                        minDist = dist;
                        min = nodes[i];
                        if (dist == 0)
                            break;
                    }
                }
                var start = min;
                this.path = [start];
                this.currentNode = 0;

                this.graph = graph;
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