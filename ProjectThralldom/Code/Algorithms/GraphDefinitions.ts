module Thralldom {
    export module Algorithms {
        export interface IGraph {
            rowCount: number;
            colCount: number;
            size: number;
            nodes: Array<Rectangle>;
            edges: INumberIndexable<Array<number>>;
        }

        export class Rectangle implements IHashable {
            public x: number;
            public y: number;
            public width: number;
            public height: number;
            public center: THREE.Vector2;

            public points: Array<THREE.Vector2>;

            constructor(x, y, width, height) {
                this.x = x;
                this.y = y;
                this.width = width;
                this.height = height;
                this.center = new THREE.Vector2(x + width / 2, y + height / 2);

                this.points = [
                    new THREE.Vector2(x, y),
                    new THREE.Vector2(x + width, y),
                    new THREE.Vector2(x + width, y + height),
                    new THREE.Vector2(x, y + height),
                ];
            }

            public toString(): string {
                return "X: ", this.x + ", Y:" + this.y + ", W: " + this.width + ", H: " + this.height;
            }

            public hash(): number {
                // Rectangles are nonoverlapping thus we only need their toplefties
                var hash = 23;
                hash = hash * 31 + this.x;
                hash = hash * 31 + this.y;
                return hash;
            }

            public distanceTo(other: Rectangle): number {
                return this.center.distanceTo(other.center);
            }

            public distanceToSquared(other: Rectangle): number {
                return this.center.distanceToSquared(other.center);
            }

            public contains(p: THREE.Vector2): boolean {
                return this.x <= p.x && this.x + this.width >= p.x &&
                       this.y <= p.y && this.y + this.height >= p.y;
            }
        }
    }
}