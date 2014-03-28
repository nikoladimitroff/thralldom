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

        public loadFromDescription(description: any, content: ContentManager): void {
            this.mesh = content.getContent(description.model);
            this.animation = new THREE.Animation(this.mesh, this.mesh.geometry.animation.name, THREE.AnimationHandler.LINEAR);

            //this.animationData = content.getContent(content.getAnimationFilePath(description.model));

            this.characterAnimations = <any> {};
            this.characterAnimations[CharacterStates.Sheathing] = "PistolSheath";
            this.characterAnimations[CharacterStates.Attacking] = "PistolShoot";
            this.characterAnimations[CharacterStates.Unsheathing] = "PistolUnsheath";

        }
    }
} 