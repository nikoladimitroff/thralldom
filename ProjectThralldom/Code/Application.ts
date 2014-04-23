module Thralldom {
    export interface IMetaGameData {
        world: string;
        quest: string;
        scripts: Array<string>;
        assets: string;
    }

    export class Application {
        // Game specific
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

        // World
        public hero: Character;

        public enemies: Array<Character>;
        public ammunitions: Array<Ammunition>;

        public static MetaFilePath = "Content/Meta.js";

        public world: Thralldom.World;
        public quest: Thralldom.Quest;
        private scripts: Array<ScriptedEvent>;
        private activeScript: ScriptedEvent;

        // Helping variables
        private raycastPromiseUid: number = -1;


        // Constants
        private static zoomSpeed: number = 5;

        // Managers
        private physics: PhysicsManager;
        private input: InputManager;
        private ui: UIManager;
        private content: ContentManager;
        private audio: AudioManager;
        private combat: CombatManager;
        private language: Languages.ILanguagePack;


        // Debug settings
        private debugDraw: boolean = false;
        private noClip: boolean = false;

        constructor(container: HTMLElement) {
            this.webglContainer = container;
            this.physics = new PhysicsManager();
            this.input = new InputManager(container);
            this.ui = new UIManager();
            this.language = new Languages.English();
            this.content = new ContentManager();
            this.audio = new AudioManager(this.content);
            this.clock = new THREE.Clock();
        }

        public init(meta: IMetaGameData): void {
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

            this.renderer.setSize(this.webglContainer.offsetWidth, this.webglContainer.offsetHeight);
            this.webglContainer.appendChild(this.renderer.domElement);

            // Detect going out of focus
            // TODO
            Utilities.setWindowFocusListener((isVisible) => {
                if (!isVisible) {
                    this.pause();
                }
            });
            this.isOnFocus = true;

            this.input.attachCancelFullscreenListener(this.pause.bind(this));

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


            window.addEventListener("resize", Utilities.GetOnResizeHandler(this.webglContainer, this.renderer, this.cameraController.camera));

            // npcs
            this.enemies = <Array<Character>> this.world.select(".guard");

            // ammo
            this.ammunitions = new Array<Ammunition>();

            // Lights

            var ambient = new THREE.AmbientLight(0x606060);
            this.world.renderScene.add(ambient);

            var directionalLight = new THREE.DirectionalLight(0x505050, 0.5);
            directionalLight.position.set(0.51, 0.1, 1);

            this.world.renderScene.add(directionalLight);

            // Fog
            //var fog = new THREE.FogExp2(0x0A0A0A);
            //this.world.renderScene.fog = fog;

            // Combat
            this.combat = new CombatManager(this.world, this.physics, this.hero, this.enemies);

            // Subs
            var subtitleContainer = this.ui.subtitles;
            Subs.fixDomElement(subtitleContainer);


            this.world.mergeStatics();

        }

        private beforeRun(): void {
            this.audio.playSound("Crickets", this.cameraController.camera, true, true);
            this.clock.start();
        }

        private handleKeyboard(delta: number) {

            this.cameraController.handleKeyboard(delta, this.input, this.keybindings);
        }

        private handleMouse(delta: number) {

            this.cameraController.handleMouse(delta, this.input);
            // See if our raycast request has been resolved. 
            var ray = this.physics.tryResolveRaycast(this.raycastPromiseUid);
            // If no request is currently pending, request another
            if (!ray && this.raycastPromiseUid == -1) {
                var pos = this.cameraController.position;
                var target = (new THREE.Vector3).subVectors(this.hero.mesh.position, this.hero.centerToMesh);

                this.physics.requestRaycast(pos, target);
            }
            // If the request has been fullfilled, do stuff
            if (ray) {
                if (ray.hasHit && ray.collisionObjectId != this.hero.mesh.id) {
                    // Magic Number
                    var mult = 1 - 2.5 * delta;
                    this.cameraController.distance *= mult;
                }
                this.raycastPromiseUid = -1;
            }
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
                return;
            }

            // Run physics before everything else
            this.physics.update(delta);

            this.handleKeyboard(delta);
            this.handleMouse(delta);

            this.triggerScriptedEvents();

            var questComplete = this.quest.getActiveObjectives().length == 0;
            var questText = questComplete ?
                "Quest complete!" :
                "Your current quest:\n" + this.quest.toString();


            var sokolov = <any>this.world.select("#sokolov")[0];
            this.ui.text.innerHTML =  questText +
                                Utilities.formatString("Position: {0}\n", Utilities.formatVector(this.hero.mesh.position, 3));

            var frameInfo = this.combat.update(this.debugDraw);

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

        private selectBoundingVisual(mesh: THREE.Mesh): THREE.Mesh {
            return <THREE.Mesh> mesh.children.filter((x) => x instanceof THREE.Mesh && !(x instanceof THREE.SkinnedMesh))[0];;
        }

        // Debugging tools and utilities below
        public pause(): void {
            this.ui.pausedScreen.style.display = "block";
            this.isOnFocus = false; 
        }

        public toggleDebugDraw(debugDraw?: boolean): void {
            if (debugDraw !== undefined) {
                this.debugDraw = debugDraw;
            }
            else {
                this.debugDraw = !this.debugDraw;
            }

            var allObjects = this.world.statics.concat(this.world.dynamics);
            for (var index in allObjects) {
                var boundingShape = this.selectBoundingVisual(allObjects[index].mesh);
                if (boundingShape) {
                    boundingShape.visible = this.debugDraw;
                }
            }
            var debuggingLines = this.world.renderScene.children.filter((x) => x.name == "debug");
            debuggingLines.forEach((x) => this.world.renderScene.remove(x));
        }
    }
}