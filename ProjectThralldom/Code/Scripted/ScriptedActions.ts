module Thralldom {


    export interface IScriptedAction {
        hasCompleted: boolean;
        update(character: Character, world: Thralldom.World, delta: number): void;
        begin(character: Character, extras: IExtraScriptedData): void;
    }

    export interface IExtraScriptedData {
        storyteller?: Storyteller;
        cameraController?: CameraControllers.ICameraController;
    }

    export class MultiAction implements IScriptedAction {
        public static Keyword = " and ";

        private actions: Array<IScriptedAction>;

        constructor(actions: Array<IScriptedAction>, content: ContentManager, extras: IExtraScriptedData) {
            this.actions = actions;
        }

        public get hasCompleted(): boolean {
            return this.actions.every((action) => action.hasCompleted);
        }

        public begin(character: Character, extras: IExtraScriptedData): void {
            for (var i = 0; i < this.actions.length; i++) {
                this.actions[i].begin(character, extras);
            }
        }

        public update(character: Character, scene: Thralldom.World, delta: number): void {
            for (var i = 0; i < this.actions.length; i++) {
                this.actions[i].update(character, scene, delta);
            }            
        }
    }

    export class GotoAction implements IScriptedAction {

        public static Keyword: string = "goto";

        public hasCompleted: boolean;

        private destination: THREE.Vector2;
        private target: THREE.Vector2;
        private isAdditive: boolean;

        constructor(args: string, content: ContentManager, extras: IExtraScriptedData) {
            this.isAdditive = args.startsWith("+");
            // Replace the plus at the start if one is present
            this.target = Utilities.parseVector2(args.replace(/^\+/g, ""));
        }

        public begin(character: Character, extras: IExtraScriptedData): void {
            this.destination = this.target;
            if (this.isAdditive) {
                this.destination.add(GeometryUtils.Vector3To2(character.mesh.position));
            }
        }

        public update(character: Character, world: Thralldom.World, delta: number): void {
            if (this.hasCompleted)
                return;

            var characterPos = GeometryUtils.Vector3To2(character.mesh.position);
            var diff = new THREE.Vector2();
            diff.subVectors(this.destination, characterPos);
            var distance = diff.length();

            diff.normalize();
            var diff3d = GeometryUtils.Vector2To3(diff);
            character.mesh.quaternion.copy(GeometryUtils.quaternionFromVectors(Const.ForwardVector, diff3d));

            character.stateMachine.requestTransitionTo(CharacterStates.Walking);

            // MAGIC NUMBER
            var radius = 5;
            this.hasCompleted = distance < radius;
        }
    }

    export class LookAtAction implements IScriptedAction {
        public static Keyword: string = "lookat";

        public hasCompleted: boolean;

        private lookat: THREE.Vector2;

        constructor(args: string, content: ContentManager, extras: IExtraScriptedData) {
            this.lookat = Utilities.parseVector2(args);
        }


        public begin(character: Character, extras: IExtraScriptedData): void { }

        public update(character: Character, world: Thralldom.World, delta: number): void {
            var characterPos = GeometryUtils.Vector3To2(character.mesh.position);
            var diff = new THREE.Vector2();
            diff.subVectors(this.lookat, characterPos);
            var distance = diff.length();

            diff.normalize();
            var diff3d = GeometryUtils.Vector2To3(diff);
            character.mesh.quaternion.copy(GeometryUtils.quaternionFromVectors(Const.ForwardVector, diff3d));

            character.stateMachine.requestTransitionTo(CharacterStates.Idle);

            this.hasCompleted = true;
        }
    }

    export class WaitAction implements IScriptedAction {
        public static Keyword: string = "wait";

        public hasCompleted: boolean;

        private delay: number;
        private startTime: number;

        constructor(args: string, content: ContentManager, extras: IExtraScriptedData) {
            this.delay = parseFloat(args);

        }

        public begin(character: Character, extras: IExtraScriptedData): void {
            this.startTime = Date.now();
        }

        public update(character: Character, world: Thralldom.World, delta: number): void {
            character.stateMachine.requestTransitionTo(CharacterStates.Idle);

            this.hasCompleted = Math.abs(Date.now() - this.startTime) >= this.delay;
        }
    }

    export class DialogAction implements IScriptedAction {
        public static Keyword: string = "say";

        public hasCompleted: boolean;

        private hasStarted = false;
        private completeImmediately = false;

        private delay: number;
        private startTime: number;

        private subtitles: string;
        private audio: string;
        private content: ContentManager;

        private static nowKeyword = "now";
        constructor(args: string, content: ContentManager, extras: IExtraScriptedData) {
            this.completeImmediately = args.indexOf(DialogAction.nowKeyword) != -1;

            var files = args.replace(DialogAction.nowKeyword, "").trim().split("|");
            this.audio = files[0].trim();
            this.subtitles = files[1].trim();

            this.content = content;
        }

        public begin(character: Character, extras: IExtraScriptedData): void {
            this.startTime = Date.now();
        }

        public update(character: Character, world: Thralldom.World, delta: number): void {
            if (!this.hasStarted) {
                var subtitles = new Subs.FixedSubtitles(this.content.getContent(this.subtitles));
                Subs.playSubtitles(subtitles);
                AudioManager.instance.playSound(this.audio, character.mesh, false, false);

                this.hasStarted = true;
            }

            character.stateMachine.requestTransitionTo(CharacterStates.Idle);

            this.hasCompleted = this.hasCompleted || this.completeImmediately || AudioManager.instance.hasFinished(this.audio, character.mesh);
        }
    }

    export class TellAction implements IScriptedAction {

        public static Keyword: string = "tell";

        public hasCompleted: boolean;

        private hasStarted = false;

        private content: ContentManager;
        private storyteller: Storyteller;
        private interval: number;

        constructor(args: string, content: ContentManager, extras: IExtraScriptedData) {

            this.storyteller = extras.storyteller;
            var regex = /story by (\d*)\b/g;
            this.interval = ~~regex.exec(args)[1];

            this.content = content;
        }

        public begin(character: Character, extras: IExtraScriptedData): void {
            this.storyteller.play(this.interval);
            this.storyteller.onDone = () => this.hasCompleted = true;
        }

        public update(character: Character, world: Thralldom.World, delta: number): void {

        }
    }

    /** This action applies only on the camera, I know, I know, the API sucks.
     * Go see some cute kittens to calm down. 
    */
    export class FlyAction implements IScriptedAction {

        public static Keyword: string = "flycamera";

        public hasCompleted: boolean;

        private content: ContentManager;

        private from: THREE.Vector3;
        private to: THREE.Vector3;
        private cameraController: CameraControllers.ICameraController;
        private lerpCoefficient: number;
        private duration: number;
        private pathGenerator: (character: Character, delta: number) => THREE.Vector3;

        constructor(args: string, content: ContentManager, extras: IExtraScriptedData) {

            var coordinatesRegex = /.*(\(-?\d+,\s*-?\d+,\s*-?\d+\)).*(\(-?\d+,\s*-?\d+,\s*-?\d+\)).*?(\d+)/g;
            var matches = coordinatesRegex.exec(args);
            this.from = Utilities.parseVector3(matches[1]);
            this.to = Utilities.parseVector3(matches[2]);
            this.duration = ~~matches[3] * 1e-3;

            this.pathGenerator = args.endsWith("line") ? this.linearUpdate : this.arcUpdate;

            this.content = content;
        }

        public begin(character: Character, extras: IExtraScriptedData): void {
            this.cameraController = extras.cameraController;
            var cam = this.cameraController.camera;

            cam.position.copy(character.mesh.position).sub(character.centerToMesh).sub(this.from);
            cam.lookAt(character.mesh.position);
            this.lerpCoefficient = 0;

            this.cameraController.ignoreInput = true;
        }

        private linearUpdate(character: Character, delta: number): THREE.Vector3 {
            var characterToCamera = new THREE.Vector3();
            characterToCamera.copy(this.from).lerp(this.to, this.lerpCoefficient).applyQuaternion(character.mesh.quaternion);

            return characterToCamera;
        }
        
        private arcUpdate(character: Character, delta: number): THREE.Vector3 {
            var forward = (new THREE.Vector3()).copy(Const.ForwardVector).applyQuaternion(character.mesh.quaternion);
            var norm1 = (new THREE.Vector3()).copy(this.from).normalize();
            var norm2 = (new THREE.Vector3()).copy(this.to).normalize();

            var q1 = (new THREE.Quaternion()).setFromUnitVectors(forward, norm1);
            var q2 = (new THREE.Quaternion()).setFromUnitVectors(forward, norm2);

            q1.slerp(q2, this.lerpCoefficient);

            var l1 = this.from.length(),
                l2 = this.to.length();
            var length = l1 + (l2 - l1) * this.lerpCoefficient;

            var characterToCamera = new THREE.Vector3();
            characterToCamera.copy(Const.ForwardVector).applyQuaternion(q1).multiplyScalar(length);

            return characterToCamera;
        }

        public update(character: Character, world: Thralldom.World, delta: number): void {

            var characterToCamera = this.pathGenerator(character, delta);

            this.lerpCoefficient += delta / this.duration;

            var cam = this.cameraController.camera;
            var target = (new THREE.Vector3()).subVectors(character.mesh.position, character.centerToMesh);
            cam.position.copy(target).add(characterToCamera);
            cam.lookAt(target);

            this.hasCompleted = this.lerpCoefficient >= 1;
            if (this.hasCompleted) {
                this.cameraController.ignoreInput = false;
            }
        }
    }
} 