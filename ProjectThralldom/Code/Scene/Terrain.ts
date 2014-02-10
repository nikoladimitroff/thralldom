module Thralldom {
    export class Terrain implements ISelectableObject {

        public mesh: THREE.Mesh;
        public id = "terrain";
        public tags: Array<string> = [];

        constructor(content: ContentManager) {
            var texture = content.getContent(ContentLibrary.Textures.BlueGreenCheckerPNG);
            var planeGeometry = new THREE.PlaneGeometry(300, 300);
            var planeMaterial = new THREE.MeshPhongMaterial({ map: texture });
            var plane = new THREE.Mesh(planeGeometry, planeMaterial);
            plane.rotation.x = -Math.PI / 2;
            plane.receiveShadow = true;

            this.mesh = plane;
        }
    }
} 