module Thralldom {


    export interface IScriptedAction {
        hasCompleted: boolean;
        update(character: Character, world: Thralldom.World, delta: number): void;
        begin(): void;
    }

    export class MultiAction implements IScriptedAction {
        public static Keyword = " and ";

        private actions: Array<IScriptedAction>;

        constructor(actions: Array<IScriptedAction>, content: ContentManager) {
            this.actions = actions;
        }

        public get hasCompleted(): boolean {
            return this.actions.every((action) => action.hasCompleted);
        }

        public begin(): void {
            for (var i = 0; i < this.actions.length; i++) {
                this.actions[i].begin();
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

        constructor(args, content: ContentManager) {
            this.destination = Utilities.parseVector2(args);
        }

        public begin(): void { }

        public update(character: Character, world: Thralldom.World, delta: number): void {
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

        constructor(args, content: ContentManager) {
            this.lookat = Utilities.parseVector2(args);
        }


        public begin(): void { }

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

        constructor(args, content: ContentManager) {
            this.delay = parseFloat(args);

        }

        public begin(): void {
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

        private delay: number;
        private startTime: number;

        private subtitles: string;
        private audio: string;
        private content: ContentManager;

        constructor(args: any, content: ContentManager) {
            var files = args.split("|");
            this.audio = files[0].trim();
            this.subtitles = files[1].trim();

            this.content = content;
        }

        public begin(): void {
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

            this.hasCompleted = AudioManager.instance.hasFinished(this.audio, character.mesh);
        }
    }
} 