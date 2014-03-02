module Thralldom {
    export class Ammo extends DynamicObject {
        mesh: THREE.Mesh;
        isNeeded(): boolean {
            throw new Error("This is class is abstract");
        }        


        public update(delta: number): void {
        }
    }
} 