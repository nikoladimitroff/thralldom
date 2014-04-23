module Thralldom {
    export module AI {
        export class AIController {

            public character: Character;
            public script: ScriptController;
            public graph: Algorithms.IGraph;
            public path: Array<THREE.Vector2>;
            public currentNode: number;

            constructor(character: Character, graph: Algorithms.IGraph) {
                var astar = new Algorithms.AStar(graph);
                var start = new THREE.Vector3(graph.nodes[0].x, 0, graph.nodes[0].y);
                var goal = new THREE.Vector3(graph.nodes[graph.nodes.length - 1].x, 0, graph.nodes[graph.nodes.length - 1].y)

                this.path = astar.runQuery(start, goal);
                this.currentNode = 0;
                this.character = character;
            }

            public update(delta: number, world: Thralldom.World): void {
                if (this.character.isDead) {
                    this.character.stateMachine.requestTransitionTo(CharacterState.Dying);
                }
                else {
                    if (this.script) {
                        this.script.update(this.character, world, delta);
                    }
                    else {
                        this.updateCallback(delta, world);
                    }

                    this.character.stateMachine.requestTransitionTo(CharacterState.Falling);
                    this.character.stateMachine.requestTransitionTo(CharacterState.Idle);
                }
                this.character.stateMachine.update(delta);
            }

            public updateCallback(delta: number, world: Thralldom.World): void {

            }
        }
    }
} 