module Thralldom {
    export class Terrain {

        public mesh: THREE.Mesh;

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