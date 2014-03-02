module Thralldom {
    export class Character extends DynamicObject {
        public static MaxViewAngle = Math.PI / 3;


        public get mesh(): THREE.Mesh {
            return this.skinnedMesh;
        }

        public animation: THREE.Animation;
        public keepPlaying: boolean;

        private skinnedMesh: THREE.SkinnedMesh;
        private hp: number;
        private range: number;
        private damage: number;

        public get health(): number {
            return this.hp;
        }

        public set health(value: number) {
            this.hp = value;
        }

        constructor() {
            super();

            this.hp = 100;
            this.range = 100;
            this.damage = 1;
        }

        public loadFromDescription(description: any, content: ContentManager): void {
            super.loadFromDescription(description, content);

            if (description.model) {
                this.skinnedMesh = content.getContent(description["model"]);
                this.animation = new THREE.Animation(this.skinnedMesh, this.skinnedMesh.geometry.animation.name, THREE.AnimationHandler.LINEAR);
                //this.animation.play();
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

            this.rigidBody = PhysicsManager.computeRigidBodyFromMesh(this.mesh, 100);
            
        }

        public attack(enemy: Character, hitPoint: THREE.Intersection): Ammo {
            // Only attack if the viewing angle between the character and the target is less than Character.MaxViewAngle and the character is in range.
            var distance = new THREE.Vector3();
            distance.subVectors(enemy.mesh.position, this.mesh.position);
            var forwardVector = new THREE.Vector3(0, 0, 1);
            forwardVector.transformDirection(this.mesh.matrix);

            if (distance.length() < this.range && distance.angleTo(forwardVector) < Character.MaxViewAngle) {
                enemy.health -= this.damage;

            }

            // For now, always shoot a laser.
            var startPoint = new THREE.Vector3();
            startPoint.copy(this.mesh.position).y = 10;
            var laser = new LaserOfDeath(startPoint, hitPoint.point);
            return laser;

            return undefined;
        }
    }
} 