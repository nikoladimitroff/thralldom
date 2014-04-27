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

        export interface ICharacterController extends IController {
            handleMouse(delta: number, input: InputManager): void;
            handleKeyboard(delta: number, input: InputManager, keybindings: IKeybindings): void;
        }
    }
} 