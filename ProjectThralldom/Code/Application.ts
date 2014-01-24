module Thralldom {
    export class Application {
        // Game specific
        private updateInterval: number;

        // Three.js variables
        private scene: THREE.Scene;
        private camera: THREE.Camera;
        private cameraController: CameraControllers.ThirdPersonLockCameraController;
        private renderer: THREE.WebGLRenderer;
        private container: HTMLElement;

        private keybindings = {
            rotateLeft: InputManager.keyNameToKeyCode("A"),
            rotateRight: InputManager.keyNameToKeyCode("D"),
            moveForward: InputManager.keyNameToKeyCode("W"),
            moveBackward: InputManager.keyNameToKeyCode("S")
        };

        public hero: Character;

        // Constants
        private cameraSpeed: number = 5;

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
            // TP Camera controller
            this.cameraController = new CameraControllers.ThirdPersonLockCameraController(
                this.camera, this.hero.mesh, 70, new THREE.Vector3(0, 25, 0));

            this.scene.add(this.hero.mesh);

            // Floor
            var texture = THREE.ImageUtils.loadTexture(ContentLibrary.Textures.RedCheckerPNG);
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

            var axes = new THREE.AxisHelper(1000);
            this.scene.add(axes);
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
            movement.z = (this.input.mouse.scroll - this.input.previousMouse.scroll) / 120;

            this.cameraController.distance -= movement.z * this.cameraSpeed;
        }

        private update(): void {
            this.handleKeyboard();
            this.handleMouse();

            var node = document.getElementsByTagName("nav").item(0).getElementsByTagName("p").item(0);
            node.innerText = this.language.welcome + "\n" +  this.input.mouse.toString();



            this.cameraController.update(this.updateInterval);
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