module Thralldom {
    export interface ISelectableObject {
        id: string;
        tags: Array<string>;
        mesh: THREE.Mesh;
        rigidBody: CANNON.RigidBody;
    }
}