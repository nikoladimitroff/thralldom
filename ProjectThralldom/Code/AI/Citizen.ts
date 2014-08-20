module Thralldom {
    export module AI {
        export class Citizen extends AIController {

            private target: THREE.Vector2;
            private goal: THREE.Vector2;

            private previousPos: THREE.Vector2;

            constructor(character: Character, graph: Algorithms.IGraph) {
                super(character, graph);

                var pos = GeometryUtils.Vector3To2(character.mesh.position);
                this.previousPos = new THREE.Vector2(1 << 31, 1 << 31);
                this.randomizeGoal(pos);
                this.target = Pathfinder.closestPoint(pos, this.path[0], this.path[1], 0);
            }

            public updateCallback(delta: number, world: Thralldom.World): void {
                var character = this.character;
                var pos = GeometryUtils.Vector3To2(character.mesh.position);

                var movement = this.previousPos.distanceToSquared(pos);
                console.log(movement);
                if (GeometryUtils.almostZero(movement))
                    this.unstuck();

                var node = this.path[this.currentRectangle];
                if (pos.distanceToSquared(this.target) <= this.character.radius * this.character.radius) {
                    if (this.currentRectangle == this.path.length - 1) {
                        this.target = this.goal;
                        this.randomizeGoal(this.target);
                        character.mesh.parent.remove(character.mesh.parent.getObjectByName(character.id + "GOAL", false));
                        character.mesh.parent.add(GeometryUtils.getLine([this.target, this.goal], -character.centerToMesh.y,
                                                  character.id + "GOAL", 0xFFFFFF));
                        this.currentRectangle = -1;
                    }
                    else 
                        this.target = Pathfinder.closestPoint(pos,
                            this.path[this.currentRectangle],
                            this.path[this.currentRectangle + 1],
                            this.character.radius);

                    this.currentRectangle++;

                    character.mesh.parent.remove(character.mesh.parent.getObjectByName(character.id + "TARGET", false));
                    character.mesh.parent.add(GeometryUtils.getLine([pos, this.target], -character.centerToMesh.y, character.id + "TARGET"));
                }
                this.previousPos = pos;
                character.walkTowards(pos, this.target);
            }

            private randomizeGoal(currentPos: THREE.Vector2): void {
                var nextRect = Pathfinder.Graph.nodes[~~(Math.random() * Pathfinder.Graph.nodes.length)];
                this.goal = GeometryUtils.randomPointInRect(nextRect);
                this.path = Pathfinder.query(currentPos, this.goal);
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
                    this.target = right2d;
                }
            }
        }
    }
} 