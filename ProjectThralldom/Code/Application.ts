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

        public hero: Character;

        public enemies: Array<Character>;
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
            this.input = new InputManager(container);
            this.ui = new UIManager();
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


            // npcs
            this.enemies = <Array<Character>> this.world.select(".guard");

            // ammo
            this.ammunitions = new Array<Ammunition>();

            // Lights

            var ambient = new THREE.AmbientLight(0x5C5C5C);
            this.world.renderScene.add(ambient);

            var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
            directionalLight.position.set(1, 1, 1);

            this.world.renderScene.add(directionalLight);

            // Combat
            this.combat = new CombatManager(this.world, this.hero, this.enemies);

            // Audio
            this.audio.playSound("Soundtrack", this.cameraController.camera, true, true);
            var subtitleContainer = this.ui.subtitles;
            Subs.fixDomElement(subtitleContainer);

            this.toggleDebugDraw(false);
        }

        private handleKeyboard(delta: number) {

            this.cameraController.handleKeyboard(delta, this.input, this.keybindings);
        }

        private handleMouse(delta: number) {

            this.cameraController.handleMouse(delta, this.input);

            var pos = this.cameraController.position;
            var target = (new THREE.Vector3).subVectors(this.hero.mesh.position, this.hero.rigidBody.centerToMesh);

            var ray = this.world.physicsManager.raycast(pos, target);

            if (ray.hasHit() && ray.get_m_collisionObject().a != this.hero.rigidBody.a) {

                // Magic Number
                var mult = 1 - 2.5 * delta;
                this.cameraController.distance *= mult;
                return;
                //var distance = this.ray.get_m_hitPointWorld().distance(this.fromWorldVec);

                var hpammo = ray.get_m_hitPointWorld();
                var hitPoint = new THREE.Vector3(hpammo.x(), hpammo.y(), hpammo.z());

                var ab = (new THREE.Vector3()).subVectors(target, pos).normalize();
                var bc = (new THREE.Vector3()).subVectors(target, hitPoint).normalize();
                var ac = (new THREE.Vector3()).subVectors(hitPoint, pos).normalize();

                this.ui.text.innerHTML =
                    "Pos: " + Utilities.formatVector(pos, 3) + "\n" +
                    "Target: " + Utilities.formatVector(target, 3) + "\n" +
                    "Boycho: " + Utilities.formatVector(this.hero.mesh.position, 3) + "\n" +
                    "Hit point: " + Utilities.formatVector(hitPoint, 3) + "\n" +
                    "AB: " + Utilities.formatVector(ab, 3) + "\n" +
                    "BC: " + Utilities.formatVector(bc, 3) + "\n" +
                    "AC: " + Utilities.formatVector(ac, 3) + "\n" +
                    Utilities.formatString("Pointers: {0}  {1}  {2}\n", ray.get_m_collisionObject().a, this.hero.rigidBody.a, this.world.statics.filter((x) => x instanceof Terrain)[0].rigidBody.a) +
                    "";
                
                //this.cameraController.distance -= distance * 1.05;
                //console.log(distance);
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

            this.handleKeyboard(delta);
            this.handleMouse(delta);

            this.triggerScriptedEvents();

            var questComplete = this.quest.getActiveObjectives().length == 0;
            var questText = questComplete ?
                "Quest complete!" :
                "Your current quest:\n" + this.quest.toString();

            var currentAnimTime = this.hero.animation.currentTime;

            var sokolov = <any>this.world.select("#sokolov")[0];
            this.ui.text.innerHTML =
                this.language.welcome + "\n" +
                Utilities.formatString("Boycho's hp: {0}\n", this.hero.health) +
                Utilities.formatString("Sokolov's hp: {0}\n", sokolov.health) +
                Utilities.formatString("Velocity: {0}\n", Utilities.formatVector(this.hero.rigidBody.getLinearVelocity(), 7)) +
                Utilities.formatString("Current pos: {0}\n", Utilities.formatVector(this.hero.mesh.position, 5)) +
                Utilities.formatString("State: {0}\n", StateMachineUtils.translateState(this.hero.stateMachine.current)) +
                Utilities.formatString("Current anim time: {0}\n", currentAnimTime.toFixed(6)) + 
                questText;

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

        public run(meta: IMetaGameData): void {
            this.init(meta);
            window.addEventListener("resize", Utilities.GetOnResizeHandler(this.webglContainer, this.renderer, this.cameraController.camera));
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

            var allObjects = this.world.dynamics.concat(this.world.statics);
            for (var index in allObjects) {
                var boundingShape = this.selectBoundingVisual(allObjects[index].mesh);
                if (boundingShape) {
                    boundingShape.visible = this.debugDraw;
                }
            }
            var debuggingLines = this.world.renderScene.children.filter((x) => x.name == "debug");
            debuggingLines.forEach((x) => this.world.renderScene.remove(x));
        }

        public toggleNoClip(noClip?: boolean): void {
            if (noClip !== undefined) {
                this.noClip = noClip;
            }
            else {
                this.noClip = !this.noClip;
            }
            var sizeCoefficientAbsolute = 1 / 100;
            var sizeCoefficient = this.noClip ? sizeCoefficientAbsolute : 1 / sizeCoefficientAbsolute;

            var staticBodies = this.world.statics.filter((x) => !(x instanceof Terrain) && !(x instanceof Skybox));
            var physWorld = this.world.physicsManager.world;
            for (var i in staticBodies) {
                var rigidBody = staticBodies[i].rigidBody;
                var mesh = staticBodies[i].mesh;
                physWorld.removeRigidBody(rigidBody);

                Ammo.destroy(rigidBody);
                mesh.scale.multiplyScalar(sizeCoefficient);
                rigidBody = PhysicsManager.computeStaticBoxBody(mesh);
                mesh.scale.divideScalar(sizeCoefficient);
                this.selectBoundingVisual(mesh).scale.multiplyScalar(sizeCoefficient);
                staticBodies[i].rigidBody = rigidBody;
                physWorld.addRigidBody(rigidBody);
            }
        }
    }
}