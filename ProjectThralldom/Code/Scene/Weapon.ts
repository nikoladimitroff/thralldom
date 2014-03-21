module Thralldom {
    export class Weapon implements IDrawable, ILoadable {

        public mesh: THREE.SkinnedMesh;
        public animation: THREE.Animation;

        public loadFromDescription(description: any, content: ContentManager): void {
            this.mesh = content.getContent(description.model);
            this.animation = new THREE.Animation(this.mesh, this.mesh.geometry.animation.name, THREE.AnimationHandler.LINEAR);
        }
    }
} 