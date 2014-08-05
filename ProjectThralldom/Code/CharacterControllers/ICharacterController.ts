module Thralldom {
    export module CharacterControllers {
        export interface IKeybindings {
            moveForward: number;
            moveBackward: number;
            strafeRight: number;
            strafeLeft: number;
            jump: number;
            sprint: number;
            interact: number;
        }

        export interface ICharacterController extends IController {
            character: Character;
            script: ScriptController;
            canInteract: boolean;

            handleMouse(delta: number, input: InputManager): void;
            handleKeyboard(delta: number, input: InputManager, keybindings: IKeybindings,
                           questManager: QuestManager, scriptManager: ScriptManager): void;
            handleInteraction(camera: CameraControllers.ICameraController, world: World): void;
        }
    }
} 