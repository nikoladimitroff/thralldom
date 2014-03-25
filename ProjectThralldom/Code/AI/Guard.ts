module Thralldom {
    export module AI {
        export class Guard extends AIController {

            private target: Character;
            private isAlerted: boolean;

            constructor(character: Character, graph: Algorithms.IGraph) {
                super(character, graph);
                this.isAlerted = false;
            }

            private chaseOrAttack(guardToTarget: THREE.Vector3, guardToTargetDist: number): void {
                var guard = this.character;

                var rotation = GeometryUtils.quaternionFromVectors(Const.ForwardVector, guardToTarget);
                guard.mesh.quaternion.copy(rotation);

                if (guardToTargetDist <= guard.range) {
                    guard.stateMachine.requestTransitionTo(CharacterStates.Shooting);
                }
                else if (guardToTargetDist >= guard.range * 3) {
                    this.isAlerted = false;
                }
                else {
                    if (!guard.stateMachine.requestTransitionTo(CharacterStates.Sprinting)) {
                        guard.stateMachine.requestTransitionTo(CharacterStates.Walking);
                        guard.stateMachine.requestTransitionTo(CharacterStates.Sprinting);
                    }
                }
            }

            private scanAround(scene: Thralldom.World, guardToTarget: THREE.Vector3, guardToTargetDist: number): void {
                var guard = this.character;

                var ray = scene.physicsManager.raycast(guard, this.target);
                if (ray.hasHit()) {

                    var guardForward = new THREE.Vector3(0, 0, 1);
                    guardForward.transformDirection(guard.mesh.matrix);

                    var inLineOfSight =
                        ray.get_m_collisionObject().ptr == this.target.rigidBody.ptr &&
                        guardForward.angleTo(guardToTarget) <= guard.settings.viewAngle;

                    var isCloseEnough = guardToTargetDist < guard.range * 0.2;

                    if (inLineOfSight && isCloseEnough) {
                        this.isAlerted = true;
                    }
                }
            }

            public updateCallback(delta: number, scene: Thralldom.World): void {

                var guard = this.character;

                this.target = <Character> scene.select("#hero")[0];

                var guardToTarget = new THREE.Vector3();
                guardToTarget.subVectors(this.target.mesh.position, guard.mesh.position);
                var guardToTargetDist = guardToTarget.length();
                
                if (this.isAlerted) {  
                    this.chaseOrAttack(guardToTarget, guardToTargetDist);
                }
                else {
                    this.scanAround(scene, guardToTarget, guardToTargetDist);
                }
            }
        }
    }
} 