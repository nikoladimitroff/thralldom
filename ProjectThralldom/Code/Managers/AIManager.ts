module Thralldom {
    export class AIManager {

        public controllers: Array<AI.AIController>;
        public graph: Algorithms.IGraph;

        constructor() {
            this.controllers = new Array<AI.AIController>();

            var locations: Array<Algorithms.Vertex> = [
            ];

            var edges: Array<Thralldom.Algorithms.Edge> = [
            ];

            var graph: Algorithms.IGraph = {
                nodes: locations,
                edges: edges,
            };

            this.graph = graph;
        }

        public update(delta: number, world: Thralldom.World) {
            for (var i = 0; i < this.controllers.length; i++) {
                this.controllers[i].update(delta, world);
            }
        }
    }
} 