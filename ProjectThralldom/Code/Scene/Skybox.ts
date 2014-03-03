module Thralldom {
    export class Skybox extends LoadableObject {

        public loadFromDescription(description: any, content: ContentManager): void {
            super.loadFromDescription(description, content);

            if (!description.textures || !(description.textures instanceof Array) || description.textures.length != 6) {
                throw new Error("You must provide precisely 6 pictures in the textures property of the skybox!");
            }


            var cubemap = THREE.ImageUtils.loadTextureCube(description.textures); // load textures
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

            var size = description.size || 1000;
            // create skybox mesh
            var skybox = new THREE.Mesh(new THREE.CubeGeometry(size, size, size), skyBoxMaterial);
            this.mesh = skybox;
            var box = new CANNON.Box(new CANNON.Vec3(size / 2, size / 2, size / 2));
            this.rigidBody = new CANNON.RigidBody(0, box);
        }
    }
} 