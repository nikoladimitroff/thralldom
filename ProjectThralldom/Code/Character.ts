module Thralldom {
    export class Character {
        public mesh: THREE.Object3D;

        constructor(content: ContentManager) {

            //var texture = THREE.ImageUtils.loadTexture(ContentLibrary.Textures.BlueGreenCheckerPNG);
            //var scale = 20;
            //var geometry = new THREE.CubeGeometry(scale, scale, scale);
            //var material = new THREE.MeshPhongMaterial({ map: texture});
            //this.mesh = new THREE.Mesh(geometry, material);
            //this.mesh.position.y = scale / 2;
            //this.mesh.castShadow = true;

            this.mesh = content.getContent(ContentLibrary.Models.Spartan.spartanJS);
            this.mesh.scale.set(20, 20, 20);


        }
    }
} 