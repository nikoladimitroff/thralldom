module Thralldom {
    export module AI {
        export class Guard extends AIController {

            private target: Character;
            private isAlerted: boolean;

            private raycastPromiseUid: number = -1;

            constructor(character: Character, graph: Algorithms.IGraph) {
                super(character, graph);
                this.isAlerted = false;
            }

            private chaseOrAttack(guardToTarget: THREE.Vector3, guardToTargetDist: number): void {
                var guard = this.character;

                var rotation = GeometryUtils.quaternionFromVectors(Const.ForwardVector, guardToTarget);
                guard.mesh.quaternion.copy(rotation);

                // If in attack range, attack
                if (guardToTargetDist <= guard.range) {
                    if (!guard.stateMachine.requestTransitionTo(CharacterStates.Attacking))
                        guard.stateMachine.requestTransitionTo(CharacterStates.Unsheathing);
                }
                // If out of range, let him go
                else if (guardToTargetDist >= guard.range * 3) {
                    this.isAlerted = false;
                }
                // Chase
                else {
                    // WARNING: I smell bugs here, what if the target runs away from the guard in time less than the time needed to finish sheathing the weapon?
                    if (guard.stateMachine.current == CharacterStates.Attacking) {
                        guard.stateMachine.requestTransitionTo(CharacterStates.Sheathing);
                        return;
                    }

                    if (!guard.stateMachine.requestTransitionTo(CharacterStates.Sprinting)) {
                        guard.stateMachine.requestTransitionTo(CharacterStates.Walking);
                        guard.stateMachine.requestTransitionTo(CharacterStates.Sprinting);
                    }
                }
            }

            private scanAround(guardToTarget: THREE.Vector3, guardToTargetDist: number): void {
                var guard = this.character;

                var ray = PhysicsManager.instance.tryResolveRaycast(this.raycastPromiseUid);
                if (!ray && this.raycastPromiseUid == -1) {
                    var from = new THREE.Vector3();
                    from.subVectors(guard.mesh.position, guard.centerToMesh);

                    var to = new THREE.Vector3();
                    to.subVectors(this.target.mesh.position, this.target.centerToMesh);

                    this.raycastPromiseUid = PhysicsManager.instance.requestRaycast(from, to);
                }

                if (ray) {
                    this.raycastPromiseUid = -1;
                    if (ray.hasHit) {
                        var guardForward = new THREE.Vector3(0, 0, 1);
                        guardForward.transformDirection(guard.mesh.matrix);

                        var inLineOfSight =
                            ray.collisionObjectId == this.target.mesh.id &&
                            guardForward.angleTo(guardToTarget) <= guard.settings.viewAngle;

                        var isCloseEnough = guardToTargetDist < guard.range * 0.5;

                        if (inLineOfSight && isCloseEnough) {
                            this.isAlerted = true;
                        }
                    }
                }
            }

            public updateCallback(delta: number, world: Thralldom.World): void {

                var guard = this.character;

                this.target = <Character> world.select("#hero")[0];

                var guardToTarget2d = new THREE.Vector2();
                guardToTarget2d.subVectors(GeometryUtils.Vector3To2(this.target.mesh.position),
                                           GeometryUtils.Vector3To2(guard.mesh.position));

                var guardToTarget = GeometryUtils.Vector2To3(guardToTarget2d);

                var guardToTargetDist = guardToTarget.length();
                
                if (this.isAlerted) {  
                    this.chaseOrAttack(guardToTarget, guardToTargetDist);
                }
                else {
                    this.scanAround(guardToTarget, guardToTargetDist);
                }
            }
        }
    }
} 