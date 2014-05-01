/// <reference path="../../scripts/typings/ammo.d.ts" />
module Thralldom {
    export class Terrain extends LoadableObject {

        public mesh: THREE.Mesh;
        public id = "terrain";
        public tags: Array<string> = [];

        private loadMesh(description: any, content: ContentManager, scale: number) {
            var isIE = navigator["sayswho"].indexOf("IE") != -1

            if ((description.texture && !description.model) || isIE) {
                if (isIE) scale *= 10;

                var texture = <THREE.Texture>content.getContent(description.texture);
                if (description.repeatTexture) {
                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                    texture.repeat.set(2, 2);
                }

                var planeGeometry = new THREE.PlaneGeometry(scale, scale);
                var planeMaterial = new THREE.MeshPhongMaterial({ map: texture });
                var plane = new THREE.Mesh(planeGeometry, planeMaterial);
                plane.rotation.x = -Math.PI / 2;
                

                this.mesh = plane;
                var physicsInfo: IWorkerMeshInfo = <any>{
                    pos: new VectorDTO(0, 0, 0),
                    rot: new QuatDTO(0, 0, 0, 1),
                    mass: 0,
                    scale: scale,
                };
                PhysicsManager.instance.computePhysicsBody(this, physicsInfo, BodyType.Plane);
            }
            else if (description.model) {
                var mesh = <THREE.Mesh>content.getContent(description.model);
                mesh.scale.set(scale, scale, scale);
                this.mesh = mesh;

                var meshInfo: IWorkerMeshInfo = <any> {
                    shapeUID: description.model,
                    mass: 0,
                    pos: new VectorDTO(mesh.position.x, mesh.position.y, mesh.position.z),
                    rot: new QuatDTO(mesh.quaternion.x, mesh.quaternion.y, mesh.quaternion.z, mesh.quaternion.w),
                    scale: scale,
                    faces: this.mesh.geometry.faces.map((face) => new FaceDTO(face["a"], face["b"], face["c"])),
                    vertices: this.mesh.geometry.vertices.map((vertex) => new VectorDTO(vertex.x, vertex.y, vertex.z)),
                }
                PhysicsManager.instance.computePhysicsBody(this, meshInfo, BodyType.TriangleMesh);
            }
            else {
                throw new Error("Can't load terrain, please provide a texture or a model!");
            }

            var material: THREE.MeshLambertMaterial = <THREE.MeshLambertMaterial> this.mesh.material;


            material.map.anisotropy = isIE ? 1 : Const.MaxAnisotropy;
            material.map.generateMipmaps = !isIE;
        }

        public loadFromDescription(description: any, content: ContentManager): void {
            if (!description.texture) {
                throw new Error("Terrain needs a texture!");
            }

            super.loadFromDescription(description, content);
            if (!description.scale) {
                throw new Error("Invalid or missing value for terrain scale!");
            }

            var scale = description.scale || 0;
            this.loadMesh(description, content, scale);
           

        }
    }
}
