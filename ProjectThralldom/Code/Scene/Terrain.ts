module Thralldom {
    export class Terrain implements ISelectableObject {

        public mesh: THREE.Mesh;
        public id = "terrain";
        public tags: Array<string> = [];

        constructor(content: ContentManager) {
            var texture = <THREE.Texture>content.getContent(ContentLibrary.Textures.DirtTextureJPG);
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(2, 2);
            var planeGeometry = new THREE.PlaneGeometry(10, 10);
            var planeMaterial = new THREE.MeshPhongMaterial({ map: texture });
            var plane = new THREE.Mesh(planeGeometry, planeMaterial);
            plane.rotation.x = -Math.PI / 2;
            plane.receiveShadow = true;

            this.mesh = plane;
        }
    }
} 