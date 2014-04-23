module Thralldom {

    export enum WeaponStates {
        Idle,
        Sheathing,
        Attacking,
        Unsheathing
    }

    export class Weapon implements IDrawable, ILoadable {

        public mesh: THREE.SkinnedMesh;
        public animation: THREE.Animation;
        public animationData: Map<WeaponStates, IAnimationData>;
        public characterAnimations: Map<WeaponStates, string>;

        public get attackWaiting(): boolean {
            return this._attackWorldFrom != null;
        }
        public get attackWorldFrom(): THREE.Vector3 {
            var result = this._attackWorldFrom;
            this._attackWorldFrom = null;
            return result;
        }
        public get attackForward(): THREE.Vector3 {
            var result = this._attackForward;
            this._attackForward = null;
            return result;
        }

        public _attackWorldFrom: THREE.Vector3;
        public _attackForward: THREE.Vector3;

        public loadFromDescription(description: any, content: ContentManager): void {
            this.mesh = content.getContent(description.model);
            this.animation = new THREE.Animation(this.mesh, this.mesh.geometry.animation.name, THREE.AnimationHandler.LINEAR);

            //this.animationData = content.getContent(content.getAnimationFilePath(description.model));

            this.characterAnimations = <any> {};
            this.characterAnimations[CharacterState.Sheathing] = "PistolSheath";
            this.characterAnimations[CharacterState.Attacking] = "PistolShoot";
            this.characterAnimations[CharacterState.Unsheathing] = "PistolUnsheath";

        }

        public attack(worldFrom: THREE.Vector3, forward: THREE.Vector3): void {
            this._attackWorldFrom = worldFrom;
            this._attackForward = forward;
        }
    }
} 