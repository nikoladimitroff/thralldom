module Thralldom {
    export class Environment implements ISelectableObject {

        public id: string;
        public tags: Array<string>;
        public mesh: THREE.Object3D;

        constructor() {

            this.id = null;
            this.tags = [];
        }

        public loadFromDescription(description: any, content: ContentManager): void {
            if (description.tags) {
                this.tags = this.tags.concat(<Array<string>>description.tags);
            }
            if (description.id) {
                this.id = description.id;
            }

            if (description.model) {
                this.mesh = content.getContent(description["model"]);
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
        }
    }
} 