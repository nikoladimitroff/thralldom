module Thralldom {
    export class Environment extends LoadableObject implements IInteractable {


        public get displayName(): string {
            return this.id;
        }


        public loadFromDescription(description: any, content: ContentManager): void {
            super.loadFromDescription(description, content);

            if (description.model) {
                this.mesh = content.getContent(description["model"]);
            }

            if (description.pos) {
                this.mesh.position.set(description.pos[0], description.pos[1], description.pos[2]);
            }
            if (description.rot) {
                var rot = description.rot;
                this.mesh.rotation.set(rot[0], rot[1], rot[2]);
            }
            if (description.scale) {
                var scale = description.scale;
                this.mesh.scale.set(scale, scale, scale);
            }

            this.mesh.geometry.computeBoundingBox();
            var box = this.mesh.geometry.boundingBox;

            var meshInfo: IWorkerMeshInfo = <any> {
                shapeUID: description.model,
                mass: 0,
                pos: this.mesh.position,
                rot: new QuatDTO(this.mesh.quaternion.x, this.mesh.quaternion.y, this.mesh.quaternion.z, this.mesh.quaternion.w),
                scale: this.mesh.scale.x,
                halfExtents: (new THREE.Vector3()).subVectors(box.max, box.min).multiplyScalar(this.mesh.scale.x / 2),
                faces: this.mesh.geometry.faces.map((face) => new FaceDTO(face["a"], face["b"], face["c"])),
                vertices: this.mesh.geometry.vertices.map((vertex) => new VectorDTO(vertex.x, vertex.y, vertex.z)),
            };
            meshInfo.centerToMesh = new VectorDTO(0, -meshInfo.halfExtents.y, 0);

            PhysicsManager.instance.computePhysicsBody(this, meshInfo, BodyType.TriangleMesh);
        }
    }
} 