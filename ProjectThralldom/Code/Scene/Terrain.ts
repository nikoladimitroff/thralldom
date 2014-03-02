module Thralldom {
    export class Terrain implements ISelectableObject {

        public mesh: THREE.Mesh;
        public rigidBody: CANNON.RigidBody;
        public id = "terrain";
        public tags: Array<string> = [];

        constructor(content: ContentManager) {
            var texture = <THREE.Texture>content.getContent(ContentLibrary.Textures.grass2JPG);
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(2, 2);
            var planeGeometry = new THREE.PlaneGeometry(2000, 2000);
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