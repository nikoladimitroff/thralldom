module Thralldom {
    export class Application {
        // Game specific
        private updateInterval: number;

        // Three.js variables
        private clock: THREE.Clock;
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
        public static scene: THREE.Scene;
        public quest: Thralldom.Quest;

        // Constants
        private static cameraSpeed: number = 5;
        private delta: number;

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
            Application.scene = this.scene.renderScene;
            this.quest = this.content.getContent(ContentLibrary.Quests.defaultJS);
            this.renderer = new THREE.WebGLRenderer({ antialias: true });

            this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
            this.container.appendChild(this.renderer.domElement);

            // Request pointer lock
            if (Thralldom.InputManager.isMouseLockSupported())
                this.input.requestPointerLock(document.body);

            // Scene 


            this.hero = <Character> this.scene.select("#hero")[0];
            // Camera controller
            this.cameraController = new CameraControllers.SkyrimCameraController(
                this.container.offsetWidth / this.container.offsetHeight,
                Application.cameraSpeed,
                this.hero,
                70,
                new THREE.Vector3(0, 25, 0),
                <Skybox>this.scene.select("~skybox")[0]);


            // npcs
            this.npcs = <Array<Character>> this.scene.select(".npc");

            // ammo
            this.ammunitions = new Array<Ammo>();

            // Lights
            var pointLight = new THREE.PointLight(0xffffff, 2, 100);
            pointLight.position = new THREE.Vector3(0, 100, 30);
            this.scene.renderScene.add(pointLight);
            var ambient = new THREE.AmbientLight(0xffffff);
            this.scene.renderScene.add(ambient);

            // Axes
            var axes = new THREE.AxisHelper(1000);
          //  this.scene.renderScene.add(axes);
        }

        private loadContent(): void {
            this.content.loadSkinnedModel(ContentLibrary.Models.Engineer.engineerJS);
            this.content.loadTexture(ContentLibrary.Textures.BlackWhiteCheckerJPG);
            this.content.loadTexture(ContentLibrary.Textures.DirtTextureJPG);
            this.content.loadTexture(ContentLibrary.Textures.GrassJPG);

            this.content.loadSkinnedModel(ContentLibrary.Models.Test.BoychoAnimJS);


            this.content.loadModel(ContentLibrary.Models.bore.objectHouse1JS);
            this.content.loadModel(ContentLibrary.Models.bore.objectMarketJS);
            this.content.loadModel(ContentLibrary.Models.bore.objectTerrainJS);
            this.content.loadModel(ContentLibrary.Models.bore.barrelsoneJS);
            this.content.loadModel(ContentLibrary.Models.bore.barrelstwoJS);
            this.content.loadModel(ContentLibrary.Models.bore.monasteryobjectJS);

         //   this.content.loadModel(ContentLibrary.Models.bore.houseoneJS);
            this.content.loadModel(ContentLibrary.Models.bore.housetwoJS);


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
            mouse3d.x = 0;
            mouse3d.y = 0;

            var caster = projector.pickingRay(mouse3d, this.cameraController.camera);
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
            this.delta = delta;

            this.handleKeyboard(delta);
            this.handleMouse(delta);

            var node = document.getElementsByTagName("nav").item(0).getElementsByTagName("p").item(0);
            var questComplete = this.quest.getActiveObjectives().length == 0;
            var questText = questComplete ?
                "Quest complete!" :
                "Your current quest:\n" + this.quest.toString();

            node.innerText = this.language.welcome + "\n" +
              //  this.input.mouse.toString() + "\n" +
                Utilities.formatString("Current pos: ({0}, {1}, {2})\n", this.hero.mesh.position.x.toFixed(5), this.hero.mesh.position.y.toFixed(5), this.hero.mesh.position.z.toFixed(5)) +
                questText;

            var frameInfo = new FrameInfo(this.scene, this.hero, []);
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
            if (!this.hero.keepPlaying) {
                this.hero.animation.stop();
            }
            this.hero.keepPlaying = false;
            this.input.swap();
        }
        
        private draw() {
            this.update();
            this.stats.begin();
            this.renderer.render(this.scene.renderScene, this.cameraController.camera);
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
                    window.addEventListener("resize", Utilities.GetOnResizeHandler(this.container, this.renderer, this.cameraController.camera));
                    this.loop();
                }
            }
        }
    }
}