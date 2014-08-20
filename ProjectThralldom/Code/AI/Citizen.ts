module Thralldom {
    export module AI {
        export class Citizen extends AIController {

            public target: THREE.Vector2;
            public goal: THREE.Vector2;

            constructor(character: Character, graph: Algorithms.IGraph) {
                super(character, graph);

                this.goal = new THREE.Vector2(-50.43, 203.6);
                this.path = Pathfinder.query(character.mesh.position, GeometryUtils.Vector2To3(this.goal));
                var pos = character.mesh.position;
                this.target = GeometryUtils.closestPoint(GeometryUtils.Vector3To2(pos), this.path[0], this.path[1], 0);
            }

            public updateCallback(delta: number, world: Thralldom.World): void {

                var character = this.character;
                var pos = GeometryUtils.Vector3To2(character.mesh.position);

                var node = this.path[this.currentRectangle];
                if (pos.distanceToSquared(this.target) <= this.radiusSquared) {
                    if (this.currentRectangle == this.path.length - 1) {
                        this.target = this.goal;
                        var nextRect = Pathfinder.Graph.nodes[~~(Math.random() * Pathfinder.Graph.nodes.length)];
                        this.goal = GeometryUtils.randomPointInRect(nextRect);
                        this.path = Pathfinder.query(this.target, this.goal);
                        character.mesh.parent.remove(character.mesh.parent.getObjectByName(character.id + "GOAL", false));
                        character.mesh.parent.add(GeometryUtils.getLine([this.target, this.goal], -character.centerToMesh.y,
                                                  character.id + "GOAL", 0xFFFFFF));
                        this.currentRectangle = -1;
                    }
                    else 
                        this.target = GeometryUtils.closestPoint(pos,
                            this.path[this.currentRectangle],
                            this.path[this.currentRectangle + 1],
                            Math.sqrt(this.radiusSquared));

                    this.currentRectangle++;

                    character.mesh.parent.remove(character.mesh.parent.getObjectByName(character.id + "TARGET", false));
                    character.mesh.parent.add(GeometryUtils.getLine([pos, this.target], -character.centerToMesh.y, character.id + "TARGET"));
                }


                var fromTo = new THREE.Vector2();

                fromTo.subVectors(this.target, pos).normalize();

                var quat = GeometryUtils.quaternionFromVectors(Const.ForwardVector, GeometryUtils.Vector2To3(fromTo));
                character.mesh.quaternion.copy(quat);

                character.stateMachine.requestTransitionTo(CharacterStates.Falling);
                character.stateMachine.requestTransitionTo(CharacterStates.Walking);
            }
        }
    }
} 