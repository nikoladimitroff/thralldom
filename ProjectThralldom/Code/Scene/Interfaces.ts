module Thralldom {
    export interface ILoadable {
        loadFromDescription(description: any, content: ContentManager): void;
    }

    export interface IDrawable {
        mesh: THREE.Mesh;
    }

    export interface ISelectableObject {
        id: string;
        tags: Array<string>;
    }

    export interface IInteractable {
        interaction: Interaction;
        displayName: string;
    }
} 