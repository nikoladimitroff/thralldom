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
            zoomSpeed: number;
            distance: number;
            target: THREE.Vector3;
            position: THREE.Vector3;

            handleMouseRotation(delta: number, input: InputManager): void;
            handleKeyboardHeroMovement(delta: number, input: InputManager, keybindings: IKeybindings): void;
        }
    }
} 