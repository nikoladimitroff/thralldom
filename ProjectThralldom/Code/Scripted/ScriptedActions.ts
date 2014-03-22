module Thralldom {


    export interface IScriptedAction {
        hasCompleted: boolean;
        update(character: Character, scene: Thralldom.Scene, delta: number): void;
        begin(): void;
    }

    export class MultiAction implements IScriptedAction {
        public static Keyword = " and ";

        private actions: Array<IScriptedAction>;

        constructor(actions: Array<IScriptedAction>) {
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

        public update(character: Character, scene: Thralldom.Scene, delta: number): void {
            for (var i = 0; i < this.actions.length; i++) {
                this.actions[i].update(character, scene, delta);
            }            
        }
    }

    export class GotoAction implements IScriptedAction {

        public static Keyword: string = "goto";

        public hasCompleted: boolean;

        private destination: THREE.Vector2;

        constructor(args) {
            this.destination = Utilities.parseVector2(args);
        }

        public begin(): void { }

        public update(character: Character, scene: Thralldom.Scene, delta: number): void {
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


    export class LookAt implements IScriptedAction {
        public static Keyword: string = "lookat";

        public hasCompleted: boolean;

        private lookat: THREE.Vector2;

        constructor(args) {
            this.lookat = Utilities.parseVector2(args);
        }


        public begin(): void { }

        public update(character: Character, scene: Thralldom.Scene, delta: number): void {
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

    export class WaitFor implements IScriptedAction {
        public static Keyword: string = "wait";

        public hasCompleted: boolean;

        private delay: number;
        private startTime: number;

        constructor(args) {
            this.delay = parseFloat(args);

        }

        public begin(): void {
            this.startTime = Date.now();
        }

        public update(character: Character, scene: Thralldom.Scene, delta: number): void {
            character.stateMachine.requestTransitionTo(CharacterStates.Idle);

            this.hasCompleted = Math.abs(Date.now() - this.startTime) >= this.delay;
        }
    }
} 