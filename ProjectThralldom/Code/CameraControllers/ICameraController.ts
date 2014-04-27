module Thralldom {
    export module CameraControllers {
        export interface ICameraController {
            ignoreInput: boolean;
            camera: THREE.PerspectiveCamera;
            zoomSpeed: number;
            distance: number;
            position: THREE.Vector3;

            handleMouse(delta: number, input: InputManager): void;
            handleKeyboard(delta: number, input: InputManager, keybindings: CharacterControllers.IKeybindings): void;
        }
    }
} 