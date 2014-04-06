module Thralldom {

    export enum CharacterStates {
        Idle,
        Walking,
        Sprinting,
        Jumping,
        Falling,
        Unsheathing,
        Attacking,
        Sheathing,
        Dying
    }

    export interface IAnimationData {
        startFrame: number;
        endFrame: number;
    }

    export class Character extends DynamicObject {

        public static Settings: Map<string, ICharacterSettings>;


        public settings: ICharacterSettings;

        public mesh: THREE.SkinnedMesh;
        public animation: THREE.Animation;

        public weapon: Weapon;

        public range: number;

        private hp: number;
        public damage: number;

        public get health(): number {
            return this.hp;
        }

        public set health(value: number) {
            this.hp = value;
        }

        public get isDead(): boolean {
            return this.hp <= 0;
        }

        public stateMachine: StateMachine;
        public animationData: Map<string, IAnimationData>;

        constructor() {
            super();

            this.hp = 100;
            this.range = 100;
            this.damage = 5;

        }

        private applySettings(settings: ICharacterSettings): void {
            for (var setting in settings) {
                this.settings[setting] = settings[setting];
            }
        }

        public loadFromDescription(description: any, content: ContentManager): void {
            super.loadFromDescription(description, content);

            this.settings = <ICharacterSettings> {};
            for (var selector in Character.Settings) {
                if (World.matches(selector, this)) {
                    this.applySettings(Character.Settings[selector]);
                }
            }

            if (description.model) {
                this.mesh = content.getContent(description["model"]);
                this.animation = new THREE.Animation(this.mesh, this.mesh.geometry.animation.name, THREE.AnimationHandler.LINEAR);

                this.animationData = content.getContent(content.getAnimationFilePath(description.model));
            }

            if (description.weapon) {
                this.weapon = new Weapon();
                this.weapon.loadFromDescription({ model: description.weapon }, content);
                this.mesh.add(this.weapon.mesh);
            }

            if (description.pos) {
                this.mesh.position.set(description.pos[0], description.pos[1], description.pos[2]);
            }
            if (description.rot) {
                var rot = description.rot;
                this.mesh.rotation.set(rot[0], rot[1], rot[2]);
            }
            if (description.scale) {
                var scale = description.scale;
                this.mesh.scale.set(scale, scale, scale);
            }

            this.rigidBody = PhysicsManager.computeCapsuleBody(this.mesh, this.settings.mass);

            this.stateMachine = StateMachineUtils.getCharacterStateMachine(this);
            
        }

        public getAnimationName(): string {
            var weaponAnimations = [CharacterStates.Unsheathing, CharacterStates.Attacking, CharacterStates.Sheathing];

            if (weaponAnimations.indexOf(this.stateMachine.current) != -1) {
                return this.weapon.characterAnimations[this.stateMachine.current];
            }

            return CharacterStates[this.stateMachine.current];
        }

        public setWalkingVelocity(delta: number, isSprinting: boolean = false): void {
            var forward = new THREE.Vector3(0, 0, 1);
            var multiplier = this.settings.movementSpeed * delta;
            if (isSprinting)
                multiplier *= this.settings.sprintMultiplier;

            forward.transformDirection(this.mesh.matrix).multiplyScalar(multiplier);

            var velocity = this.rigidBody.getLinearVelocity();
            velocity.setX(forward.x);
            velocity.setZ(forward.z);
        }
    }
} 