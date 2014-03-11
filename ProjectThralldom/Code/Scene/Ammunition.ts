module Thralldom {
    export class Ammunition extends DynamicObject {
        mesh: THREE.Mesh;
        isNeeded(): boolean {
            throw new Error("This is class is abstract");
        }        


        public update(delta: number): void {
        }
    }
} 