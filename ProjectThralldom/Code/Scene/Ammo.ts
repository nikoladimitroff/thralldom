module Thralldom {
    export class Ammo extends DynamicObject {
        mesh: THREE.Object3D;
        isNeeded(): boolean {
            throw new Error("This is class is abstract");
        }        


        public update(delta: number): void {
        }
    }
} 