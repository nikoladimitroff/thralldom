module Thralldom {
    export class Character {
        public static MaxViewAngle = Math.PI / 3;

        public mesh: THREE.SkinnedMesh;
        private hp: number;
        private range: number;
        private damage: number;

        public get health(): number {
            return this.hp;
        }

        public set health(value: number) {
            this.hp = value;
        }

        constructor(content: ContentManager) {
            this.hp = 100;
            this.range = 100;
            //this.damage = 10;

            this.mesh = content.getContent(ContentLibrary.Models.Engineer.engineerJS);
            var animation = new THREE.Animation(this.mesh, this.mesh.geometry.animation.name, THREE.AnimationHandler.LINEAR);
            animation.play();
            var scale = 0.25;
            this.mesh.scale.set(scale, scale, scale);
        }

        public attack(enemy: Character, hitPoint: THREE.Intersection): IAmmo {
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