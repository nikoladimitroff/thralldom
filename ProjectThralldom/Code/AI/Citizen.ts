module Thralldom {
    export module AI {
        export class Citizen extends AIController {

            constructor(character: Character, graph: Algorithms.IGraph) {
                super(character, graph);
            }

            public updateCallback(delta: number, world: Thralldom.World): void {

                var character = this.character;
                
                // COMMENTED

                var node = this.path[this.currentNode];
                var pos = GeometryUtils.Vector3To2(character.mesh.position);
                if (node.distanceToSquared(pos) <= this.radiusSquared) {
                    this.currentNode++;

                    if (this.currentNode == this.path.length) {
                        var current = this.path[this.path.length - 1];
                        do {
                            var next = this.graph.nodes[~~(Math.random() * this.graph.nodes.length)];
                            this.path = Algorithms.AStar.runQuery(this.graph, current, next);
                        }
                        while (this.path.length == 0);
                        this.currentNode = 0;
                        var geometry = new THREE.Geometry();
                        this.path.forEach(p => geometry.vertices.push(new THREE.Vector3(p.x, -character.centerToMesh.y, p.y)));
                        var mat = new THREE.LineBasicMaterial({ color: Utils.randomColor() });
                        var line = new THREE.Line(geometry, mat);
                        character.mesh.parent.add(line); 
                    }
                }
                var node = this.path[this.currentNode];
                var fromTo = new THREE.Vector2();

                fromTo.subVectors(new THREE.Vector2(node.x, node.y), pos).normalize();

                var quat = GeometryUtils.quaternionFromVectors(Const.ForwardVector, new THREE.Vector3(fromTo.x, 0, fromTo.y));
                character.mesh.quaternion.copy(quat);

                character.stateMachine.requestTransitionTo(CharacterStates.Falling);
                character.stateMachine.requestTransitionTo(CharacterStates.Walking);
            }
        }
    }
} 