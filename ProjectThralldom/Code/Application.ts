module Thralldom {
    export class Application {
        // Game specific
        private updateInterval: number;

        // Three.js variables
        private clock: THREE.Clock;
        private scene: THREE.Scene;
        private camera: THREE.PerspectiveCamera;
        private cameraController: CameraControllers.ICameraController;
        private renderer: THREE.WebGLRenderer;
        private container: HTMLElement;

        // stats
        private stats: Stats;

        private keybindings = {
            rotateLeft: InputManager.keyNameToKeyCode("A"),
            rotateRight: InputManager.keyNameToKeyCode("D"),
            strafeLeft: InputManager.keyNameToKeyCode("Q"),
            strafeRight: InputManager.keyNameToKeyCode("E"),
            moveForward: InputManager.keyNameToKeyCode("W"),
            moveBackward: InputManager.keyNameToKeyCode("S")
        };

        public hero: Character;

        public npcs: Array<Character>;
        public ammunitions: Array<IAmmo>;

        // Constants
        private cameraSpeed: number = 5;

        // Managers
        private input: InputManager;
        private content: ContentManager;
        private language: Languages.ILanguagePack;

        constructor(container: HTMLElement, updateInterval: number) {
            this.container = container;
            this.updateInterval = updateInterval;
            this.input = new InputManager(container);
            this.language = new Languages.English();
            this.content = new ContentManager();
            this.clock = new THREE.Clock();
        }

        private init(): void {

            this.clock.start();

            this.stats = new Stats();
            this.stats.setMode(StatsModes.Fps);
            this.stats.domElement.style.position = 'absolute';
            this.stats.domElement.style.left = '0px';
            this.stats.domElement.style.bottom = '0px';
            document.body.appendChild(this.stats.domElement);


            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(60, this.container.offsetWidth / this.container.offsetHeight, 1, 1000);
            this.renderer = new THREE.WebGLRenderer();



            this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
            this.container.appendChild(this.renderer.domElement);

            // Scene (ugly one)
            this.hero = new Character(this.content);
            // TP Camera controller
            this.cameraController = new CameraControllers.SkyrimCameraController(
                this.camera, this.hero.mesh, 70, new THREE.Vector3(0, 25, 0));

            this.scene.add(this.hero.mesh);

            // npcs
            this.npcs = new Array<Character>();
            var npcsCount = 5;
            for (var i = 0; i < npcsCount; i++) {
                this.npcs.push(new Character(this.content));
                var angle = i * 2 * Math.PI / npcsCount;
                this.npcs[i].mesh.position.x = 10 * npcsCount * Math.cos(angle);
                this.npcs[i].mesh.position.z = 10 * npcsCount * Math.sin(angle);
                this.scene.add(this.npcs[i].mesh);
            }
            // ammo
            this.ammunitions = new Array<IAmmo>();

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
            var ambient = new THREE.AmbientLight(0xffffff);
            this.scene.add(ambient);

            var axes = new THREE.AxisHelper(1000);
            this.scene.add(axes);
        }

        private loadContent(): void {
            this.content.loadSkinnedModel(ContentLibrary.Models.Engineer.engineerJS);
            this.content.loadTexture(ContentLibrary.Textures.BlueGreenCheckerPNG);
            this.content.loadTexture(ContentLibrary.Textures.RedCheckerPNG);
            //this.content.loadTexture(ContentLibrary.Models.Spartan.CclothPSD);
        }

        private handleKeyboard(delta: number) {

            this.cameraController.handleKeyboardHeroMovement(delta, this.input, this.hero, this.keybindings);
        }

        private handleMouse(delta: number) {
            this.cameraController.handleMouseRotation(delta, this.input, this.cameraSpeed);



            // Attack below, should refactor
            var projector = new THREE.Projector();
            var mouse3d = new THREE.Vector3();
            mouse3d.x = this.input.mouse.ndc.x;
            mouse3d.y = this.input.mouse.ndc.y;


            var caster = projector.pickingRay(mouse3d, this.camera);
            for (var i = 0; i < this.npcs.length; i++) {
                var intersections = caster.intersectObject(this.npcs[i].mesh);
                if (intersections.length != 0) {
                    this.hero.attack(this.npcs[i]);
                    var startPoint = new THREE.Vector3();
                    startPoint.copy(this.hero.mesh.position).y = 10;
                    var laser = new LaserOfDeath(startPoint, intersections[0].point);
                    this.ammunitions.push(laser);
                    this.scene.add(laser.mesh);
                }
            }
        }

        private update(): void {
            var delta = this.clock.getDelta();

            this.handleKeyboard(delta);
            this.handleMouse(delta);

            var node = document.getElementsByTagName("nav").item(0).getElementsByTagName("p").item(0);
            node.innerText = this.language.welcome + "\n" +  this.input.mouse.toString() + "\n" + THREE.Math.radToDeg(this.cameraController.rotation) + " " + THREE.Math.radToDeg(this.hero.mesh.rotation.y);

            // Reverse loop so that we can remove elements from the array.
            for (var i = this.npcs.length - 1; i > - 1; i--) {
                if (this.npcs[i].health <= 0) {
                    this.scene.remove(this.npcs[i].mesh);
                    this.npcs.splice(i, 1);
                }
            }
            for (var i = this.ammunitions.length - 1; i > -1; i--) {
                var ammo = this.ammunitions[i];
                if (!ammo.isNeeded()) {
                    this.scene.remove(ammo.mesh);
                    this.ammunitions.splice(i, 1);
                }
                ammo.update(delta);
            }


            THREE.AnimationHandler.update(0.9 * delta);
            this.input.swap();

            //setTimeout(() => this.update(this.updateInterval), this.updateInterval);
        }

        private draw() {
            this.update();
            this.stats.begin();
            this.renderer.render(this.scene, this.camera);
            this.stats.end();
        }

        private loop() {
            this.update();
            this.draw();

            requestAnimationFrame(() => this.loop());
        }

        public run(): void {
            this.loadContent();
            this.content.onLoaded = () => {
                this.init();
                window.addEventListener("resize", Utilities.GetOnResizeHandler(this.container, this.renderer, this.camera));
                this.loop();
            }
        }
    }
}