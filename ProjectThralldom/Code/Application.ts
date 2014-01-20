module Thralldom {
    export class Application {
        // Game specific
        private updateInterval: Number;

        // Three.js variables
        private scene: THREE.Scene;
        private camera: THREE.Camera;
        private renderer: THREE.WebGLRenderer;
        private container: HTMLElement;

        private keybindings = {
            moveLeft: InputManager.keyNameToKeyCode("A"),
            moveRight: InputManager.keyNameToKeyCode("D"),
            moveForward: InputManager.keyNameToKeyCode("W"),
            moveBackward: InputManager.keyNameToKeyCode("S")
        };

        // Managers
        private input: InputManager;
        private language: Languages.ILanguagePack;

        constructor(container: HTMLElement, updateInterval: number) {
            this.container = container;
            this.updateInterval = updateInterval;
            this.input = new InputManager();
            this.language = new Languages.Bulgarian();
        }

        private init(): void {

            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(75, this.container.offsetWidth / this.container.offsetHeight, 0.1, 1000);
            this.renderer = new THREE.WebGLRenderer();
            console.log(this.container.offsetWidth, this.container.offsetHeight);

            this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
            this.container.appendChild(this.renderer.domElement);

            // Scene (ugly one)

            var scale = 40;
            var geometry = new THREE.CubeGeometry(scale, scale, scale);
            var material = new THREE.MeshPhongMaterial({ color: 0xff0000, wireframe: true });
            var cube = new THREE.Mesh(geometry, material);
            this.scene.add(cube);
            this.camera.position.y = 75;
            this.camera.position.z = 100;
            this.camera.lookAt(cube.position);

            var planeGeometry = new THREE.PlaneGeometry(1000, 1000);
            var planeMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000, wireframe: true});
            var plane = new THREE.Mesh(planeGeometry, planeMaterial);
            this.scene.add(plane);

            var pointLight = new THREE.PointLight(0xffffff, 50, 500);
            pointLight.position = this.camera.position;
            this.scene.add(pointLight);
        }

        private handleKeyboard() {
            if (this.input.keyboard[this.keybindings.moveLeft]) {
                this.scene.children[0].position.x += 1;
            }
            if (this.input.keyboard[this.keybindings.moveRight]) {
                this.scene.children[0].position.x -= 1;
            }
            if (this.input.keyboard[this.keybindings.moveForward]) {
                this.scene.children[0].position.z -= 1;
            }
            if (this.input.keyboard[this.keybindings.moveBackward]) {
                this.scene.children[0].position.z += 1;
            }
        }

        private handleMouse() {
            var movement = new THREE.Vector3;
            movement.y = (this.input.mouse.coordinates.x - this.input.previousMouse.coordinates.x);
            movement.x = (this.input.mouse.coordinates.y - this.input.previousMouse.coordinates.y);
            movement.z = (this.input.mouse.scroll - this.input.previousMouse.scroll);
            var max = 10;
            var maxScroll = 3600;
            if (Math.abs(movement.x) > max) movement.x *= max / Math.abs(movement.x);
            if (Math.abs(movement.y) > max) movement.y *= max / Math.abs(movement.y);
            if (Math.abs(movement.z) > maxScroll) movement.z *= maxScroll / Math.abs(movement.z);

            var multiplier = 1 / max * Math.PI / 72;
            this.camera.rotation.y += movement.y * multiplier;
            this.camera.rotation.x += movement.x * multiplier;
            this.camera.position.z -= movement.z / 15;

        }

        private update() {
            //this.scene.children[0].rotation.y += 0.1;
            this.handleKeyboard();
            //this.handleMouse();

            var node = document.getElementsByTagName("nav").item(0).getElementsByTagName("p").item(0);
            node.innerText = this.language.welcome + "\n" +  this.input.mouse.toString();

            this.input.swap();

            setTimeout(() => this.update(), this.updateInterval);
        }

        private draw(deltaTime: number) {
            this.renderer.render(this.scene, this.camera);

            requestAnimationFrame((time) => this.draw(time));
        }

        public run(): void {
            this.init();
            this.update();
            this.draw(0);
        }
    }
}