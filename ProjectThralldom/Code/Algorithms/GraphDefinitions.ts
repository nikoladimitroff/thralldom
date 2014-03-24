module Thralldom {
    export module Algorithms {
        export interface IGraph {
            nodes: Array<Vertex>;
            edges: Array<Edge>;
        }

        export class Edge {
            first: number;
            second: number;

            constructor(first: number, second: number) {
                this.first = first;
                this.second = second;
            }
        }

        export class Vertex {
            x: number;
            y: number;
            constructor(x, y) {
                this.x = x;
                this.y = y;
            }

            public toString() {
                return this.x + "" + this.y;
            }

            public distanceTo(q: Vertex) {
                var p = this;
                return Math.sqrt((p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y));
            }
        }
    }
}