module Thralldom {
    export module CameraControllers {
        export interface IKeybindings {
            moveForward: number;
            moveBackward: number;
            strafeRight: number;
            strafeLeft: number;
        }


        export interface ICameraController {
            handleMouseRotation(delta: number, input: InputManager, camSpeed: number): void;
            handleKeyboardHeroMovement(delta: number, input: InputManager, hero: Character, keybindings: IKeybindings): void;
        }
    }
} 