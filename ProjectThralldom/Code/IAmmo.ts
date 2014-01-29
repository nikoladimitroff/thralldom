module Thralldom {
    export interface IAmmo {
        mesh: THREE.Object3D;
        isNeeded(): boolean;
        update(delta: number): void;

    }
} 