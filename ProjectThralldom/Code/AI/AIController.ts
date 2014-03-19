module Thralldom {
    export module AI {
        export class AIController {

            public character: Character;
            public graph: Algorithms.IGraph;
            public path: Array<THREE.Vector2>;
            public currentNode: number;

            constructor(character: Character, graph: Algorithms.IGraph) {
                var astar = new Algorithms.AStar(graph);
                this.path = astar.runQuery(graph.nodes[0], graph.nodes[graph.nodes.length - 1]);
                this.currentNode = 0;
                this.character = character;
            }

            update(delta: number, scene: Thralldom.Scene): void {

            }
        }
    }
} 