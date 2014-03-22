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
                this.path = astar.runQuery(graph.nodes[0], graph.nodes[graph.nodes.length - 1]);
                this.currentNode = 0;
                this.character = character;
            }

            public update(delta: number, scene: Thralldom.Scene): void {
                if (this.script) {
                    this.script.update(this.character, scene, delta);
                }
                else {
                    this.updateCallback(delta, scene);
                }


                this.character.stateMachine.requestTransitionTo(CharacterStates.Falling);
                this.character.stateMachine.requestTransitionTo(CharacterStates.Idle);

                this.character.stateMachine.update(delta);
            }

            public updateCallback(delta: number, scene: Thralldom.Scene): void {

            }
        }
    }
} 