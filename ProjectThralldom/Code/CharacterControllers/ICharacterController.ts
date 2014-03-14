module Thralldom {
    export module CharacterControllers {
        export interface IKeybindings {
            moveForward: number;
            moveBackward: number;
            strafeRight: number;
            strafeLeft: number;
            jump: number;
            sprint: number;
        }


        export interface ICharacterController {
            camera: THREE.PerspectiveCamera;
            cameraSpeed: number;
            distance: number;

            handleMouseRotation(delta: number, input: InputManager): void;
            handleKeyboardHeroMovement(delta: number, input: InputManager, keybindings: IKeybindings): void;
        }
    }
} 