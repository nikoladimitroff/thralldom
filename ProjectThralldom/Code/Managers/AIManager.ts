module Thralldom {
    export class AIManager {

        public controllers: Array<AI.AIController>;
        public graph: Algorithms.IGraph;

        constructor() {
            this.controllers = new Array<AI.AIController>();

            var locations: Array<THREE.Vector3> = [
                new THREE.Vector3(-393.82, 0, 51.73),
                new THREE.Vector3(90.60330488167114, 0, 120.77182926800373),
                new THREE.Vector3(-258.4222199467363, 0, 208.32359567890623),
                new THREE.Vector3(300.4222199467363, 0, 208.32359567890623),
                new THREE.Vector3(100, 0, -130),
            ];

            var edges: Array<Thralldom.Algorithms.Edge> = [
                new Algorithms.Edge(0, 1),
                new Algorithms.Edge(1, 2),
                new Algorithms.Edge(2, 3),
                new Algorithms.Edge(3, 4),
            ];

            var graph: Algorithms.IGraph = {
                nodes: locations,
                edges: edges,
            };

            this.graph = graph;
        }

        public update(delta: number, scene: Thralldom.Scene) {
            for (var i = 0; i < this.controllers.length; i++) {
                this.controllers[i].update(delta, scene);
            }
        }
    }
} 