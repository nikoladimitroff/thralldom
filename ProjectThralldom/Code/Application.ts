module Thralldom {
    export interface IMetaGameData {
        world: string;
        quest: string;
        scripts: Array<string>;
        assets: string;
    }

    export class Application {
        // Game specific
        private updateInterval: number;
        private isOnFocus: boolean;

        // Three.js variables
        private clock: THREE.Clock;
        private cameraController: CharacterControllers.ICharacterController;
        private renderer: THREE.WebGLRenderer;
        private webglContainer: HTMLElement;
        private subtitleContainer: HTMLSpanElement;

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

        public world: Thralldom.World;
        public quest: Thralldom.Quest;
        private scripts: Array<ScriptedEvent>;
        private activeScript: ScriptedEvent;


        // Constants
        private static zoomSpeed: number = 5;

        // Managers
        private input: InputManager;
        private content: ContentManager;
        private audio: AudioManager;
        private language: Languages.ILanguagePack;

        constructor(container: HTMLElement, updateInterval: number) {
            this.webglContainer = container;
            this.updateInterval = updateInterval;
            this.input = new InputManager(container);
            this.language = new Languages.English();
            this.content = new ContentManager();
            this.audio = new AudioManager(this.content);
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

            this.world = this.content.getContent(meta.world);
            this.quest = this.content.getContent(meta.quest);
            this.scripts = <Array<ScriptedEvent>> meta.scripts.map((file) => this.content.getContent(file));
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.shadowMapEnabled = true;
            this.renderer.shadowMapSoft = true;

            this.renderer.setSize(this.webglContainer.offsetWidth, this.webglContainer.offsetHeight);
            this.webglContainer.appendChild(this.renderer.domElement);

            // Request pointer lock
            if (Thralldom.InputManager.isMouseLockSupported())
                this.input.requestPointerLock(document.body);

            // Detect going out of focus
            // TODO
            //Utilities.setWindowFocusListener((isVisible) => this.isOnFocus = isVisible);
            this.isOnFocus = true;

            // World 

            this.hero = <Character> this.world.select("#hero")[0];
            // Camera controller
            this.cameraController = new CharacterControllers.SkyrimCharacterController(
                this.webglContainer.offsetWidth / this.webglContainer.offsetHeight,
                Application.zoomSpeed,
                this.hero,
                70,
                new THREE.Vector3(0, 25, 0),
                <Skybox>this.world.select("~skybox")[0]);


            // npcs
            this.npcs = <Array<Character>> this.world.select(".npc");

            // ammo
            this.ammunitions = new Array<Ammunition>();

            // Lights

            var ambient = new THREE.AmbientLight(0x999999);
            this.world.renderScene.add(ambient);

            var directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
            directionalLight.position.set(1, 1, 1);

            this.world.renderScene.add(directionalLight);

            // Audio
            this.audio.playSound("Soundtrack", this.cameraController.camera, true, true);

            var subtitleContainer = <HTMLSpanElement> document.querySelector("#subtitles span");
            Subs.fixDomElement(subtitleContainer);
        }

        private handleKeyboard(delta: number) {

            this.cameraController.handleKeyboard(delta, this.input, this.keybindings);
        }

        private handleMouse(delta: number) {
            this.cameraController.handleMouse(delta, this.input);

        }

        private triggerScriptedEvents(): void {
            if (this.activeScript) {
                if (this.activeScript.finished) {
                    this.activeScript.disable(this.world);

                    var index = this.scripts.indexOf(this.activeScript);
                    this.scripts[index] = this.scripts[this.scripts.length - 1];
                    this.scripts.pop();
                    this.activeScript = null;
                    console.log("finished, array length:", this.scripts.length);
                }

                return;
            }


            for (var i = 0; i < this.scripts.length; i++) {
                var script = this.scripts[i];
                if (script.tryTrigger(this.hero, this.world)) {
                    this.activeScript = script;
                    console.log("triggering");

                    return;
                }
            }
        }

        private update(): void {
            var delta = this.clock.getDelta();
            // Pause the game if we are out of focus
            if (!this.isOnFocus) {
                delta = 0;
            }

            this.handleKeyboard(delta);
            this.handleMouse(delta);

            this.triggerScriptedEvents();

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

            var frameInfo = new FrameInfo(this.world, this.hero, []);
            // Reverse loop so that we can remove elements from the array.
            for (var i = this.npcs.length - 1; i > - 1; i--) {
                if (this.npcs[i].health <= 0) {
                    frameInfo.killedEnemies.push(this.npcs[i]);

                    this.world.remove(this.npcs[i]);
                    this.npcs.splice(i, 1);
                }
            }

            for (var i = this.ammunitions.length - 1; i > -1; i--) {
                var ammo = this.ammunitions[i];
                if (!ammo.isNeeded()) {
                    this.world.remove(ammo);
                    this.ammunitions.splice(i, 1);
                }
            }

            this.world.update(delta);
            this.quest.update(frameInfo, this.world);

            THREE.AnimationHandler.update(0.9 * delta);
            this.audio.update(this.cameraController.camera);
            this.input.swap();
        }
        
        private draw() {
            this.stats.begin();
            this.renderer.render(this.world.renderScene, this.cameraController.camera);
            this.stats.end();
        }

        private loop() {
            this.update();
            this.draw();

            requestAnimationFrame(() => this.loop());
        }

        public run(): void {
            this.content.loadMeta(Application.MetaFilePath, (meta: IMetaGameData) => {
                this.init(meta);
                window.addEventListener("resize", Utilities.GetOnResizeHandler(this.webglContainer, this.renderer, this.cameraController.camera));
                this.loop();
            });
        }
    }
}