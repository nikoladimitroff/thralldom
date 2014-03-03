module Thralldom {
    export class Terrain extends LoadableObject {

        public mesh: THREE.Mesh;
        public rigidBody: CANNON.RigidBody;
        public id = "terrain";
        public tags: Array<string> = [];

        public loadFromDescription(description: any, content: ContentManager): void {
            if (!description.texture) {
                throw new Error("Terrain needs a texture!");
            }

            super.loadFromDescription(description, content);

            var texture = <THREE.Texture>content.getContent(description.texture);
            if (description.repeatTexture) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(2, 2);
            }

            var size = description.size || 2000;
            var planeGeometry = new THREE.PlaneGeometry(size, size);
            var planeMaterial = new THREE.MeshPhongMaterial({ map: texture });
            var plane = new THREE.Mesh(planeGeometry, planeMaterial);
            plane.rotation.x = -Math.PI / 2;
            plane.receiveShadow = true;

            this.mesh = plane;

            var planeShape = new CANNON.Plane();
            this.rigidBody = new CANNON.RigidBody(0, planeShape, PhysicsManager.material);
            this.rigidBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        }
    }
} 