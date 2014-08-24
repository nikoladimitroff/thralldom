module Thralldom {
    export module AI {
        export class Citizen extends AIController {
            private previousPos: THREE.Vector2;

            constructor(character: Character, graph: Algorithms.IGraph) {
                super(character, graph);

                var pos = GeometryUtils.Vector3To2(character.mesh.position);
                this.previousPos = new THREE.Vector2(1 << 31, 1 << 31);
                this.randomizeGoal(pos);
            }

            public updateCallback(delta: number, world: Thralldom.World): void {
                var character = this.character;
                var pos = GeometryUtils.Vector3To2(character.mesh.position);

                var movement = this.previousPos.distanceToSquared(pos);
                //console.log(movement);
                if (GeometryUtils.almostZero(movement))
                    this.unstuck();

                var target = this.path[this.currentNode].first;
                if (pos.distanceToSquared(target) <= this.character.radius * this.character.radius) {
                    if (this.currentNode == this.path.length - 1) {
                        this.randomizeGoal(target);

                        this.currentNode = -1;
                    }
                    this.currentNode++;

                }
                this.previousPos = pos;
                character.walkTowards(pos, target);
            }

            private randomizeGoal(currentPos: THREE.Vector2): void {
                var nextRect = Pathfinder.Graph.nodes[~~(Math.random() * Pathfinder.Graph.nodes.length)];
                var goal = GeometryUtils.randomPointInRect(nextRect);
                this.path = Pathfinder.query(this.character, goal);
                this.currentNode = 0;
            }

            private unstuck(): void {
                return;
                var rect = Pathfinder.getRectangle(this.previousPos);
                var stepSize = 2 * this.character.radius;
                var right = (new THREE.Vector3()).copy(Const.RightVector);
                right.applyQuaternion(this.character.mesh.quaternion).multiplyScalar(stepSize);

                var right2d = GeometryUtils.Vector3To2(right);
                right2d.add(this.previousPos);
                if (rect.contains(right2d)) {
                  //  this.target = right2d;
                }
            }
        }
    }
} 