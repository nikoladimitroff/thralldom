module Thralldom {
    export class Application {
        // Game specific
        private updateInterval: number;

        // Three.js variables
        private clock: THREE.Clock;
        private camera: THREE.PerspectiveCamera;
        private cameraController: CameraControllers.SkyrimCameraController;
        private renderer: THREE.WebGLRenderer;
        private container: HTMLElement;

        // stats
        private stats: Stats;

        private keybindings = {
            strafeLeft: InputManager.keyNameToKeyCode("A"),
            strafeRight: InputManager.keyNameToKeyCode("D"),
            moveForward: InputManager.keyNameToKeyCode("W"),
            moveBackward: InputManager.keyNameToKeyCode("S")
        };

        public hero: Character;

        public npcs: Array<Character>;
        public ammunitions: Array<Ammo>;

        public scene: Thralldom.Scene;
        public quest: Thralldom.Quest;

        // Constants
        private static cameraSpeed: number = 5;

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

            this.scene = this.content.getContent(ContentLibrary.Scenes.defaultJS);
            this.quest = this.content.getContent(ContentLibrary.Quests.defaultJS);
            this.camera = new THREE.PerspectiveCamera(60, this.container.offsetWidth / this.container.offsetHeight, 1, 1000);
            this.renderer = new THREE.WebGLRenderer();

            this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
            this.container.appendChild(this.renderer.domElement);

            // Scene (ugly one)
            this.hero = new Character(this.content);
            // Camera controller
            this.cameraController = new CameraControllers.SkyrimCameraController(
                this.camera, Application.cameraSpeed, this.hero.mesh, 70, new THREE.Vector3(0, 25, 0));

            this.scene.addDynamic(this.hero);

            // npcs
            this.npcs = <Array<Character>> this.scene.select(".npc");

            // ammo
            this.ammunitions = new Array<Ammo>();

            // Floor
            var terrain = new Thralldom.Terrain(this.content);
            this.scene.addStatic(terrain);

            // Lights
            var pointLight = new THREE.PointLight(0xffffff, 2, 1000);
            pointLight.position = new THREE.Vector3(0, 30, 30);
            this.scene.renderScene.add(pointLight);
            var ambient = new THREE.AmbientLight(0xffffff);
            this.scene.renderScene.add(ambient);

            // Axes
            var axes = new THREE.AxisHelper(1000);
            this.scene.renderScene.add(axes);
        }

        private loadContent(): void {
            this.content.loadSkinnedModel(ContentLibrary.Models.Engineer.engineerJS);
            this.content.loadTexture(ContentLibrary.Textures.BlueGreenCheckerPNG);
            this.content.loadTexture(ContentLibrary.Textures.RedCheckerPNG);
            this.content.loadSkinnedModel(ContentLibrary.Models.bore.AnimJSJS);

            // Quests
            this.content.loadQuest(ContentLibrary.Quests.defaultJS);
        }

        private handleKeyboard(delta: number) {

            this.cameraController.handleKeyboardHeroMovement(delta, this.input, this.hero, this.keybindings);
        }

        private handleMouse(delta: number) {
            this.cameraController.handleMouseRotation(delta, this.input);

            // Attack below, should refactor
            var projector = new THREE.Projector();
            var mouse3d = new THREE.Vector3();
            mouse3d.x = this.input.mouse.ndc.x;
            mouse3d.y = this.input.mouse.ndc.y;

            var caster = projector.pickingRay(mouse3d, this.camera);
            for (var i = 0; i < this.npcs.length; i++) {
                var intersections = caster.intersectObject(this.npcs[i].mesh);
                if (intersections.length != 0) {
                    var ammo = this.hero.attack(this.npcs[i], intersections[0]);
                    if (ammo) {
                        this.ammunitions.push(ammo);
                        this.scene.addDynamic(ammo);
                    }
                }
            }
        }

        private update(): void {
            var delta = this.clock.getDelta();

            this.handleKeyboard(delta);
            this.handleMouse(delta);

            var node = document.getElementsByTagName("nav").item(0).getElementsByTagName("p").item(0);
            var questComplete = this.quest.getActiveObjectives().length == 0;
            var questText = questComplete ?
                "Quest complete!" :
                "Your current quest:\n" + this.quest.toString();

            node.innerText = this.language.welcome + "\n" +
                this.input.mouse.toString() + "\n" +
                Utilities.formatString("Current pos: ({0}, {1}, {2})", this.hero.mesh.position.x, this.hero.mesh.position.y, this.hero.mesh.position.z) + "\n" +
                questText;

            var frameInfo = new FrameInfo(this.hero, []);
            // Reverse loop so that we can remove elements from the array.
            for (var i = this.npcs.length - 1; i > - 1; i--) {
                if (this.npcs[i].health <= 0) {
                    frameInfo.killedEnemies.push(this.npcs[i]);

                    this.scene.remove(this.npcs[i]);
                    this.npcs.splice(i, 1);
                }
            }

            for (var i = this.ammunitions.length - 1; i > -1; i--) {
                var ammo = this.ammunitions[i];
                if (!ammo.isNeeded()) {
                    this.scene.remove(ammo);
                    this.ammunitions.splice(i, 1);
                }
            }

            this.scene.update(delta);
            this.quest.update(frameInfo);

            THREE.AnimationHandler.update(0.9 * delta);
            this.input.swap();
        }

        private draw() {
            this.update();
            this.stats.begin();
            this.renderer.render(this.scene.renderScene, this.camera);
            this.stats.end();
        }

        private loop() {
            this.update();
            this.draw();

            requestAnimationFrame(() => this.loop());
        }

        public run(): void {
            this.loadContent();
            // Load all models
            this.content.onLoaded = () => {
                this.content.loadScene(ContentLibrary.Scenes.defaultJS);
                // Load the scene
                this.content.onLoaded = () => {
                    this.init();
                    window.addEventListener("resize", Utilities.GetOnResizeHandler(this.container, this.renderer, this.camera));
                    this.loop();
                }
            }
        }
    }
}