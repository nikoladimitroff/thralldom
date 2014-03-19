module Thralldom {
    export module AI {
        export class Guard extends AIController {

            private target: Character;
            private isSuspicious: boolean;

            constructor(character: Character, graph: Algorithms.IGraph) {
                super(character, graph);
                this.isSuspicious = false;
            }

            public update(delta: number, scene: Thralldom.Scene): void {

                var guard = this.character;

                this.target = <Character> scene.select("#hero")[0];

                if (this.target) {
                    var guardToTarget = new THREE.Vector3();
                    guardToTarget.subVectors(this.target.mesh.position, guard.mesh.position);

                    var rotation = GeometryUtils.quaternionFromVectors(Const.ForwardVector, guardToTarget);
                    guard.mesh.quaternion.copy(rotation);

                    if (guardToTarget.length() <= guard.range) {

                        guard.stateMachine.requestTransitionTo(CharacterStates.Shooting);
                    }
                    else {
                        if (!guard.stateMachine.requestTransitionTo(CharacterStates.Sprinting)) {
                            guard.stateMachine.requestTransitionTo(CharacterStates.Walking);
                            guard.stateMachine.requestTransitionTo(CharacterStates.Sprinting);
                        }
                    }
                }
                else if (this.isSuspicious) {
                    //if exceed_suspiciousness(suspicious)
                    //    target = suspicious
                }
                else {
                            //suspicious = scan_area
                }

                guard.stateMachine.requestTransitionTo(CharacterStates.Falling);

                guard.stateMachine.update(delta);

            }
        }
    }
} 