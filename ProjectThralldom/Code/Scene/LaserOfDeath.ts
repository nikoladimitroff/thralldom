module Thralldom {
    export class LaserOfDeath extends Ammo {
        public mesh: THREE.Object3D;
        private isStillNeeded = true;

        constructor(startingPoint: THREE.Vector3, endPoint: THREE.Vector3) {
            super();

            var geometry = new THREE.Geometry();
            geometry.vertices.push(startingPoint);
            geometry.vertices.push(endPoint);
            var material = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 100 });

            this.mesh = new THREE.Line(geometry, material);

        }

        public update(delta: number): void {
            this.isStillNeeded = false;
        }

        public isNeeded(): boolean {
            return this.isStillNeeded;
        }
    }
} 