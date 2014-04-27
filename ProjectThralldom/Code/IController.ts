module Thralldom {
    export interface IController {
        character: Character;
        script: ScriptController;
        update(delta: number, world: World): void;
    }
} 