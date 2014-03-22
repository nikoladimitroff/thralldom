module Thralldom {
    export module AI {
        export class Citizen extends AIController {

            constructor(character: Character, graph: Algorithms.IGraph) {
                super(character, graph);
            }

            public updateCallback(delta: number, scene: Thralldom.Scene): void {

                var character = this.character;

                character.setWalkingVelocity(0);

                var node = this.path[this.currentNode];
                var pos = new THREE.Vector2(character.mesh.position.x, character.mesh.position.z);
                // WARNING: MAGIC NUMBER!
                var radius = 5;
                if (pos.distanceTo(node) < radius) {
                    this.currentNode = (this.currentNode + 1) % this.path.length;

                }
                var node = this.path[this.currentNode];
                var fromTo = new THREE.Vector2();

                fromTo.subVectors(node, pos).normalize();

                var quat = GeometryUtils.quaternionFromVectors(Const.ForwardVector, new THREE.Vector3(fromTo.x, 0, fromTo.y));
                character.mesh.quaternion.copy(quat);

                //character.stateMachine.requestTransitionTo(CharacterStates.Falling);
                character.stateMachine.requestTransitionTo(CharacterStates.Walking);
            }
        }
    }
} 