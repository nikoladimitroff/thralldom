module Thralldom {
    export interface IMetaGameData {
        scene: string;
        quest: string;
    }

    export class Application {
        // Game specific
        private updateInterval: number;

        // Three.js variables
        private clock: THREE.Clock;
        private cameraController: CharacterControllers.ICharacterController;
        private renderer: THREE.WebGLRenderer;
        private container: HTMLElement;

        // stats
        private stats: Stats;

        private keybindings = {
            strafeLeft: InputManager.keyNameToKeyCode("A"),
            strafeRight: InputManager.keyNameToKeyCode("D"),
            moveForward: InputManager.keyNameToKeyCode("W"),
            moveBackward: InputManager.keyNameToKeyCode("S"),
            jump: InputManager.keyNameToKeyCode("Space"),
            sprint: InputManager.keyNameToKeyCode("Shift"),
        };

        public hero: Character;

        public npcs: Array<Character>;
        public ammunitions: Array<Ammunition>;

        public static MetaFilePath = "Content/Meta.js";

        public scene: Thralldom.Scene;
        public quest: Thralldom.Quest;

        // Constants
        private static zoomSpeed: number = 5;

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

        private init(meta: IMetaGameData): void {

            this.clock.start();

            this.stats = new Stats();
            this.stats.setMode(StatsModes.Fps);
            this.stats.domElement.style.position = 'absolute';
            this.stats.domElement.style.left = '0px';
            this.stats.domElement.style.bottom = '0px';
            document.body.appendChild(this.stats.domElement);

            this.scene = this.content.getContent(meta.scene);
            this.quest = this.content.getContent(meta.quest);
            this.renderer = new THREE.WebGLRenderer({ antialias: true });

            this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
            this.container.appendChild(this.renderer.domElement);

            // Request pointer lock
            if (Thralldom.InputManager.isMouseLockSupported())
                this.input.requestPointerLock(document.body);

            // Scene 


            this.hero = <Character> this.scene.select("#hero")[0];
            // Camera controller
            this.cameraController = new CharacterControllers.SkyrimCharacterController(
                this.container.offsetWidth / this.container.offsetHeight,
                Application.zoomSpeed,
                this.hero,
                70,
                new THREE.Vector3(0, 25, 0),
                <Skybox>this.scene.select("~skybox")[0]);


            // npcs
            this.npcs = <Array<Character>> this.scene.select(".npc");

            // ammo
            this.ammunitions = new Array<Ammunition>();

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
            this.content.loadTexture(ContentLibrary.Textures.BlackWhiteCheckerJPG);
            this.content.loadTexture(ContentLibrary.Textures.DirtTextureJPG);
            this.content.loadTexture(ContentLibrary.Textures.GrassJPG);

            this.content.loadSkinnedModel(ContentLibrary.Models.Heroes.Boycho.BoychoAnimationJS);

            this.content.loadModel(ContentLibrary.Models.bore.objectHouse1JS);
            this.content.loadModel(ContentLibrary.Models.bore.housetwoJS);
            this.content.loadModel(ContentLibrary.Models.bore.objectTerrainJS);


            // Quests
            this.content.loadQuest(ContentLibrary.Quests.defaultJS);
        }

        private handleKeyboard(delta: number) {

            this.cameraController.handleKeyboardHeroMovement(delta, this.input, this.keybindings);
        }

        // MEMLEAK
        private fromWorldVec = new Ammo.btVector3();
        private toWorldVec = new Ammo.btVector3();
        private ray = new Ammo.ClosestRayResultCallback(this.fromWorldVec, this.toWorldVec);

        private handleMouse(delta: number) {
            this.cameraController.handleMouseRotation(delta, this.input);

            var pos = this.cameraController.position;
            var dir = this.cameraController.target;


            this.fromWorldVec.setValue(pos.x, pos.y, pos.z);
            this.toWorldVec.setValue(dir.x, dir.y, dir.z);
            this.ray.set_m_rayFromWorld(this.fromWorldVec);
            this.ray.set_m_rayToWorld(this.toWorldVec);
            this.scene.physicsSim.world.rayTest(this.fromWorldVec, this.toWorldVec, this.ray);

            //if (this.ray.hasHit()) {
            //    var distance = this.ray.get_m_hitPointWorld().distance(this.fromWorldVec);

            //    var pos = this.cameraController.position;
            //    var dir = this.cameraController.target;
            //    this.cameraController.distance -= distance * 1.05;
            //}

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

            var currentAnimTime = this.hero.animation.currentTime;

            node.innerText = this.language.welcome + "\n" +
                Utilities.formatString("Velocity: {0}\n", Utilities.formatVector(this.hero.rigidBody.getLinearVelocity(), 7)) +
                Utilities.formatString("Current pos: {0}\n", Utilities.formatVector(this.hero.mesh.position, 5)) +
                Utilities.formatString("State: {0}\n", StateMachineUtils.translateState(this.hero.stateMachine.current)) +
                Utilities.formatString("Current anim time: {0}\n", currentAnimTime.toFixed(6)) + 
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
            this.quest.update(frameInfo, this.scene);

            THREE.AnimationHandler.update(0.9 * delta);
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
                this.content.loadMeta(Application.MetaFilePath);
                // Load the scene
                this.content.onLoaded = () => {
                    this.init(this.content.getContent(Application.MetaFilePath));
                    window.addEventListener("resize", Utilities.GetOnResizeHandler(this.container, this.renderer, this.cameraController.camera));
                    this.loop();
                }
            }
        }
    }
}