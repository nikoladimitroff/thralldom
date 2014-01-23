module Thralldom {
    export class Character {
        public mesh: THREE.Mesh;

        constructor() {
            var texture = THREE.ImageUtils.loadTexture(ContentLibrary.Textures.BlueGreenCheckerPNG);
            var scale = 20;
            var geometry = new THREE.CubeGeometry(scale, scale, scale);
            var material = new THREE.MeshPhongMaterial({ map: texture});
            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.position.y = scale / 2;
            this.mesh.castShadow = true;
        }

        get forward(): THREE.Vector3 {
            var normal = new THREE.Vector3(0, 0, 1).applyMatrix4(this.mesh.matrix);
            normal.normalize();
            return normal;
        }
    }
} 