module Thralldom {
    export class Skybox implements ISelectableObject {

        public id: string;
        public tags: Array<string>;
        public mesh: THREE.Mesh;
        public rigidBody: CANNON.RigidBody;


        private static urls = [
            ContentLibrary.Textures.Skybox.posXPNG,
            ContentLibrary.Textures.Skybox.negXPNG,
            ContentLibrary.Textures.Skybox.posYPNG,
            ContentLibrary.Textures.Skybox.negYPNG,
            ContentLibrary.Textures.Skybox.negZPNG,
            ContentLibrary.Textures.Skybox.posZPNG,
        ];

        constructor() {
            var cubemap = THREE.ImageUtils.loadTextureCube(Skybox.urls); // load textures
            cubemap.format = THREE.RGBFormat;

            var shader = THREE.ShaderLib['cube']; // init cube shader from built-in lib
            shader.uniforms['tCube'].value = cubemap; // apply textures to shader

            // create shader material
            var skyBoxMaterial = new THREE.ShaderMaterial({
                fragmentShader: shader.fragmentShader,
                vertexShader: shader.vertexShader,
                uniforms: shader.uniforms,
                depthWrite: false,
                side: THREE.BackSide
            });

            // create skybox mesh
            var skybox = new THREE.Mesh(new THREE.CubeGeometry(1000, 1000, 1000), skyBoxMaterial);
            this.mesh = skybox;
            var box = new CANNON.Box(new CANNON.Vec3(500, 500, 500));
            this.rigidBody = new CANNON.RigidBody(0, box);
        }

        public update(delta: number) {

        }
    }
} 