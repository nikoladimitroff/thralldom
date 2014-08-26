module Thralldom {
    export module AI {
        export class Citizen extends AIController {
            private previousDistance: number;
            private zeroMovementCounter: number;
            private static MaxZeroMovementFrames = 15;

            constructor(character: Character, graph: Algorithms.IGraph) {
                super(character, graph);

                var pos = GeometryUtils.Vector3To2(character.mesh.position);
                this.previousDistance = Infinity;
                this.randomizeGoal(pos);
            }

            public updateCallback(delta: number, world: Thralldom.World): void {
                var character = this.character;
                var pos = GeometryUtils.Vector3To2(character.mesh.position);
                var target = this.path[this.currentNode].first;

                var distanceToTarget = pos.distanceToSquared(target);

                //console.log(movement);
                if (this.previousDistance <= distanceToTarget + 1e-1 /* don't forget the error margin*/)
                    this.zeroMovementCounter++;
                else
                    this.zeroMovementCounter = 0;

                if (this.zeroMovementCounter >= Citizen.MaxZeroMovementFrames) {
                    this.unstuck();
                    this.zeroMovementCounter = 0;
                }

                this.previousDistance = distanceToTarget;

                if (distanceToTarget <= this.character.radius * this.character.radius) {
                    if (this.currentNode == this.path.length - 1) {
                        this.randomizeGoal(target);

                        this.currentNode = -1;
                    }
                    this.currentNode++;

                }
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
                // Try moving somewhere in the current rect
                var currentRect = Pathfinder.getRectangle(this.character.mesh.position);
                var hasUnstuck = currentRect && this.tryMove(currentRect);

                if (hasUnstuck) return;

                // If all else fails, go back
                console.log("emergency", Date.now());
                if (this.currentNode != 0)
                    this.currentNode--;
                else
                    this.currentNode++;

                return;
                var closestRect = Pathfinder.getClosestRectangle(this.character.mesh.position);
                this.path.splice(this.currentNode, 0, new Pair(closestRect.center, closestRect));
            }

            private tryMove(rect: Algorithms.Rectangle): boolean {
                var stepSize = 2 * this.character.radius;
                var directions = [Const.RightVector, Const.LeftVector, Const.BackwardVector];

                for (var i = 0; i < directions.length; i++) {
                    var direction = directions[i];

                    var movement = (new THREE.Vector3()).copy(direction);
                    movement.applyQuaternion(this.character.mesh.quaternion).multiplyScalar(stepSize);

                    var movement2d = GeometryUtils.Vector3To2(movement);
                    movement2d.add(this.path[this.currentNode].first);
                    if (rect.contains(movement2d)) {
                        this.path.splice(this.currentNode, 0, new Pair(movement2d, rect));
                        console.log("Node added in direction ", direction, Date.now());
                        return true;
                    }
                }
                return false;
            }
        }
    }
} 