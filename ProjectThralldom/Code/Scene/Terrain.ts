/// <reference path="../../scripts/typings/ammo.d.ts" />
module Thralldom {
    export class Terrain extends LoadableObject {

        public mesh: THREE.Mesh;
        public rigidBody: Ammo.btRigidBody;
        public id = "terrain";
        public tags: Array<string> = [];

        private loadMesh(description: any, content: ContentManager, scale: number) {
            if (description.texture && !description.model) {
                var texture = <THREE.Texture>content.getContent(description.texture);
                if (description.repeatTexture) {
                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                    texture.repeat.set(2, 2);
                }

                var planeGeometry = new THREE.PlaneGeometry(scale, scale);
                var planeMaterial = new THREE.MeshPhongMaterial({ map: texture });
                var plane = new THREE.Mesh(planeGeometry, planeMaterial);
                plane.rotation.x = -Math.PI / 2;
                plane.receiveShadow = true;

                this.mesh = plane;
                this.rigidBody = PhysicsManager.computePlaneBody();
            }
            else if (description.model) {
                var mesh = <THREE.Mesh>content.getContent(description.model);
                mesh.scale.set(scale, scale, scale);
                this.mesh = mesh;
                this.rigidBody = PhysicsManager.computeTriangleMeshBody(mesh);
                this.mesh.receiveShadow = true;
            }
            else {
                throw new Error("Can't load terrain, please provide a texture or a model!");
            }
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
