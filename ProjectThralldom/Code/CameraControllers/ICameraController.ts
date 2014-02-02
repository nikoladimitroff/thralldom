module Thralldom {
    export module CameraControllers {
        export interface IKeybindings {
            moveForward: number;
            moveBackward: number;
            strafeRight: number;
            strafeLeft: number;
        }


        export interface ICameraController {
            camera: THREE.Camera;
            cameraSpeed: number;

            handleMouseRotation(delta: number, input: InputManager): void;
            handleKeyboardHeroMovement(delta: number, input: InputManager, hero: Character, keybindings: IKeybindings): void;
        }
    }
} 