module Thralldom {
    export interface IMetaGameData {
        world: string;
        quest: string;
        scripts: Array<string>;
        assets: string;
        items: string;
    }

    export class Application {
        // Game specific
        private isOnFocus: boolean;

        // Three.js variables
        private clock: THREE.Clock;
        private cameraController: CameraControllers.ICameraController;
        private heroController: CharacterControllers.ICharacterController;
        private renderer: THREE.WebGLRenderer;
        private effectComposer: THREE.EffectComposer;
        private webglContainer: HTMLElement;
        private subtitleContainer: HTMLSpanElement;

        private keybindings = {
            strafeLeft: InputManager.keyNameToKeyCode("A"),
            strafeRight: InputManager.keyNameToKeyCode("D"),
            moveForward: InputManager.keyNameToKeyCode("W"),
            moveBackward: InputManager.keyNameToKeyCode("S"),
            jump: InputManager.keyNameToKeyCode("Space"),
            sprint: InputManager.keyNameToKeyCode("Shift"),
            interact: InputManager.keyNameToKeyCode("F"),

            toggleUI: InputManager.keyNameToKeyCode("Z"),
            toggleCam: InputManager.keyNameToKeyCode("X"),
            toggleDebug: InputManager.keyNameToKeyCode("C"),
        };

        // World
        public hero: Character;

        public enemies: Array<Character>;
        public ammunitions: Array<Ammunition>;

        public static MetaFilePath = "Content/Meta.js";

        public world: Thralldom.World;
        public quests: QuestManager;

        // Helping variables
        private raycastPromiseUid: number = -1;


        // Constants
        private static zoomSpeed: number = 1.25;

        // Managers
        private ui: UIManager;
        private physics: PhysicsManager;
        private input: InputManager;
        private content: ContentManager;
        private audio: AudioManager;
        private combat: CombatManager;
        private scripts: ScriptManager;
        private particles: ParticleManager;
        private azure: AzureManager;
        private language: Languages.ILanguagePack;


        // Debug settings
        private debugDraw: boolean = false;
        private showHud: boolean = true;
        private noClip: boolean = false;

        constructor(container: HTMLElement) {
            this.webglContainer = container;

            this.renderer = new THREE.WebGLRenderer({ antialias: true });

            this.renderer.setSize(this.webglContainer.offsetWidth, this.webglContainer.offsetHeight);
            this.webglContainer.appendChild(this.renderer.domElement);

            Const.MaxAnisotropy = this.renderer.getMaxAnisotropy();

            this.physics = new PhysicsManager();
            this.input = new InputManager(container);
            this.ui = new UIManager();
            this.language = new Languages.English();
            this.content = new ContentManager();
            this.audio = new AudioManager(this.content);
            this.azure = new AzureManager();
            this.clock = new THREE.Clock();

            // Alerts
            Alert.setUi(this.ui.alerts);
            // Subs
            var subtitleContainer = this.ui.subtitles;
            Subs.fixDomElement(subtitleContainer);

            // Storyteller
            var imageSource = "Images/Overlay2D/smoke.png";
            var engine = new Thralldom.ParticleEngine2D(this.ui.storylineContext, imageSource, 40, 1, 0, 1, 0.45, 0.55);

            Storyteller.fixProperties(container, this.ui.storylineContext, [engine]);
        }

        public init(meta: IMetaGameData): void {
            this.world = this.content.getContent(meta.world);
            this.hero = <Character> this.world.select("#hero")[0];

            this.quests = new QuestManager(this.content.getContent(meta.quest), this.world);
            var scripts = meta.scripts.map(file => this.content.getContent(file));
            this.scripts = new ScriptManager(scripts, this.hero, this.world);

            // World 

            // Camera controller
            this.cameraController = new CameraControllers.SkyrimCameraController(
                this.webglContainer.offsetWidth / this.webglContainer.offsetHeight,
                Application.zoomSpeed,
                this.hero,
                40,
                new THREE.Vector3(0, 1, 0));
            
            var heroController = this.world.controllerManager.controllers.filter((c) => c.character == this.hero)[0];
            this.heroController = <CharacterControllers.ICharacterController> heroController;
            this.hero.inventory = this.content.getContent(meta.items);


            window.addEventListener("resize", Utils.GetOnResizeHandler(this.webglContainer, this.renderer, this.cameraController.camera));

            // npcs
            this.enemies = <Array<Character>> this.world.select(".guard");

            // ammo
            this.ammunitions = new Array<Ammunition>();


            // Combat
            this.combat = new CombatManager(this.world, this.physics, this.hero, this.enemies);

            // Particles
            var terrain = this.world.selectByStaticId("terrain").mesh;
            terrain.geometry.computeBoundingBox();
            var lengths = (new THREE.Vector3()).subVectors(terrain.geometry.boundingBox.max, terrain.geometry.boundingBox.min);
            var terrainSize = Math.max(lengths.x, lengths.y, lengths.z) * terrain.scale.x;
            this.particles = new ParticleManager(this.world.renderScene, this.hero.mesh.position, terrainSize);

            // Fog
            //var fog = new THREE.Fog(0xFFFFFF, 1, terrainSize);
            //fog.color.setHSL(0.1, 0.5, 0.4);
            //this.world.renderScene.fog = fog;


            // Detect going out of focus
            Utils.setWindowFocusListener((isVisible) => {
                if (!isVisible) {
                    this.pause();
                }
            });
            this.isOnFocus = true;

            var callback = this.requestPointerLockFullscreen.bind(this);
            this.ui.hookUI(callback, this.particles, this.azure, this.keybindings, this.hero.inventory);
            this.input.attachCancelFullscreenListener(this.pause.bind(this));


            // Effects
            this.loadEffects();

            this.world.mergeStatics();

            Pathfinder.addNavmesh(this.world.renderScene, -this.hero.centerToMesh.y);
        }

        private loadEffects(): void {

        }

        private beforeRun(): void {
            this.audio.playSound("Crickets", this.cameraController.camera, true, true);
            this.clock.start();
        }

        private handleKeyboard(delta: number) {
            this.heroController.handleKeyboard(delta, this.input, this.keybindings, this.quests, this.scripts);
            this.cameraController.handleKeyboard(delta, this.input, this.keybindings);

            if (this.input.keyboard[this.keybindings.toggleUI] && !this.input.previousKeyboard[this.keybindings.toggleUI])
                this.ui.toggleHud(!this.ui.isVisible);

            if (this.input.keyboard[this.keybindings.toggleCam] && !this.input.previousKeyboard[this.keybindings.toggleCam])
                this.changeCamera(this.cameraController instanceof CameraControllers.SkyrimCameraController);

            if (this.input.keyboard[this.keybindings.toggleDebug] && !this.input.previousKeyboard[this.keybindings.toggleDebug])
                this.toggleDebugDraw();
        }1

        private handleMouse(delta: number) {
            this.heroController.handleMouse(delta, this.input);
            this.cameraController.handleMouse(delta, this.input);
        }
        private update(): void {
            var delta = this.clock.getDelta();

            // Pause the game if we are out of focus
            if (!this.isOnFocus) {
                delta = 0;
                return;
            }

            // Run physics before everything else
            this.physics.update(delta);

            this.handleKeyboard(delta);
            this.handleMouse(delta);
            this.heroController.handleInteraction(this.cameraController, this.world);
            this.ui.viewmodel.hud.showHelp = this.heroController.canInteract;

            this.scripts.update(this.cameraController);


            var currentAnimTime = this.hero.animation.currentTime;
            //var enemy = <any>this.world.select("#enemy")[0];
            //var enemyhp = "Enemy HP: {0}\n".format(enemy.health)
            //var debug = "HP: {0}\nPosition: {1}\n".format(this.hero.health,
            //                                    Utils.formatVector(this.hero.mesh.position, 3))
            var uiText = this.quests.questText// + debug + enemyhp;


            this.ui.hud.innerHTML = uiText;

            var frameInfo = this.combat.update(this.debugDraw);

            this.particles.update(delta);
            this.world.update(delta);
            this.quests.update(frameInfo);

            THREE.AnimationHandler.update(0.9 * delta);
            this.audio.update(this.cameraController.camera);
            this.input.swap();
        }
        
        private draw() {
            if (this.effectComposer) {
                this.effectComposer.render();
            }
            else {
                this.renderer.render(this.world.renderScene, this.cameraController.camera);
            }
        }

        private loop() {
            this.ui.stats.begin();
            this.update();
            this.draw();
            this.ui.stats.end();

            requestAnimationFrame(() => this.loop());
        }

        public load(callback: (meta: IMetaGameData) => void): IProgressNotifier {
            return this.content.loadMeta(Application.MetaFilePath, callback);
        }

        // Must be called inside a click event
        public requestPointerLockFullscreen(domElement: HTMLElement): void {
            
            this.ui.pausedScreen.style.display = "none";
            this.isOnFocus = true;
            

            if (Thralldom.InputManager.isFullScreenSupported())
                this.input.requestFullscreen(document.body);

            if (Thralldom.InputManager.isMouseLockSupported())
                this.input.requestPointerLock(document.body);
        }

        public run(): void {
            this.beforeRun();
            this.loop();
        }

        // Debugging tools and utilities below
        public pause(): void {
            this.ui.pausedScreen.style.display = "block";
            this.isOnFocus = false; 
        }

        public changeCamera(freeRoam: boolean = false): void {
            if (freeRoam) {
                var startPos = (new THREE.Vector3()).addVectors(this.hero.mesh.position, new THREE.Vector3(0, Math.abs(this.hero.centerToMesh.y), 0));

                this.cameraController = new CameraControllers.FreeRoamCameraController(
                    this.webglContainer.offsetWidth / this.webglContainer.offsetHeight,
                    Application.zoomSpeed,
                    this.hero,
                    70,
                    startPos);
            }
            else {
                this.cameraController = new CameraControllers.SkyrimCameraController(
                    this.webglContainer.offsetWidth / this.webglContainer.offsetHeight,
                    Application.zoomSpeed,
                    this.hero,
                    70,
                    new THREE.Vector3(0, 25, 0));
            }
        }

        public toggleDebugDraw(debugDraw?: boolean): void {
            if (debugDraw !== undefined) {
                this.debugDraw = debugDraw;
            }
            else {
                this.debugDraw = !this.debugDraw;
            }

            if (Pathfinder.NavmeshVisualizer) Pathfinder.NavmeshVisualizer.visible = this.debugDraw;


            var debuggingLines = this.world.renderScene.children.filter(x => x.name == "debug");
            debuggingLines.forEach(x => this.world.renderScene.remove(x));
        }
    }
}