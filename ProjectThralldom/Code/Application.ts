module Thralldom {
    export class Application {
        // Game specific
        private updateInterval: Number;

        // Three.js variables
        private scene: THREE.Scene;
        private debugScene: THREE.Scene;
        private camera: THREE.Camera;
        private renderer: THREE.WebGLRenderer;
        private container: HTMLElement;

        private keybindings = {
            rotateLeft: InputManager.keyNameToKeyCode("A"),
            rotateRight: InputManager.keyNameToKeyCode("D"),
            moveForward: InputManager.keyNameToKeyCode("W"),
            moveBackward: InputManager.keyNameToKeyCode("S")
        };

        private cameraDistance: THREE.Vector3 = (new THREE.Vector3(20, 50, 20).multiplyScalar(5));
        public hero: Character;

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
            this.camera = new THREE.PerspectiveCamera(60, this.container.offsetWidth / this.container.offsetHeight, 1, 1000);
            this.renderer = new THREE.WebGLRenderer();

            this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
            this.container.appendChild(this.renderer.domElement);

            // Scene (ugly one)
            this.hero = new Character();

            this.scene.add(this.hero.mesh);

            // Floor
            var texture = THREE.ImageUtils.loadTexture("Content/Textures/red-checker.png");
            var planeGeometry = new THREE.PlaneGeometry(300, 300);
            var planeMaterial = new THREE.MeshPhongMaterial({ map: texture});
            var plane = new THREE.Mesh(planeGeometry, planeMaterial);
            plane.rotation.x = -Math.PI / 2;
            plane.receiveShadow = true;
            this.scene.add(plane);

            // Lights

            var pointLight = new THREE.PointLight(0xffffff, 2, 1000);
            pointLight.position = new THREE.Vector3(0, 30, 30);
            this.scene.add(pointLight);


            // Use a debug scene to draw stuff on top of other stuff. See draw. Coordinate axes
            this.debugScene = new THREE.Scene();
            var axes = GeometryUtils.createCoordinateAxes(1000);
            this.debugScene.add(axes[0]);
            this.debugScene.add(axes[1]);
            this.debugScene.add(axes[2]);
        }

        private handleKeyboard() {
            if (this.input.keyboard[this.keybindings.rotateLeft]) {
                this.hero.mesh.rotation.y += 0.1;
            }
            if (this.input.keyboard[this.keybindings.rotateRight]) {
                this.hero.mesh.rotation.y -= 0.1;
            }
            if (this.input.keyboard[this.keybindings.moveForward]) {
                this.hero.mesh.translateZ(1);
            }
            if (this.input.keyboard[this.keybindings.moveBackward]) {
                this.hero.mesh.translateZ(-1);
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
            this.handleKeyboard();
            this.handleMouse();

            var node = document.getElementsByTagName("nav").item(0).getElementsByTagName("p").item(0);
            node.innerText = this.language.welcome + "\n" +  this.input.mouse.toString();

            //this.camera.rotation = this.hero.mesh.rotation;
            this.camera.position.addVectors(this.hero.mesh.position, this.cameraDistance);


            this.camera.lookAt(this.hero.mesh.position);

            this.input.swap();

            setTimeout(() => this.update(), this.updateInterval);
        }

        private draw(deltaTime: number) {
            this.renderer.autoClear = false;
            this.renderer.clear();
            this.renderer.render(this.scene, this.camera);
            this.renderer.clear(false, true, false);
            this.renderer.render(this.debugScene, this.camera);

            requestAnimationFrame((time) => this.draw(time));
        }

        public run(): void {
            this.init();
            this.update();
            this.draw(0);
        }
    }
}