module Thralldom {
    export module CharacterControllers {
        export class SkyrimCharacterController implements ICharacterController {
            public character: Character;
            public script: ScriptController;

            constructor(hero: Character) {
                this.character = hero;
            }

            private handleMouseClick(delta: number, input: InputManager): void {
                if (input.mouse.leftButton) {
                    if (!this.character.stateMachine.requestTransitionTo(CharacterStates.Attacking))
                        this.character.stateMachine.requestTransitionTo(CharacterStates.Unsheathing);
                }

                if (input.mouse.rightButton) {
                    this.character.health = 0;
                }
            }

            public handleMouse(delta: number, input: InputManager): void {
                if (this.script) return;

                this.handleMouseClick(delta, input);

            }

            public handleKeyboard(delta: number, input: InputManager, keybindings: IKeybindings): void {
                if (this.script) return;

                var hero = this.character;

                // See if we are still alive
                if (this.character.isDead) {
                    this.character.stateMachine.requestTransitionTo(CharacterStates.Dying);
                }

                if (input.keyboard[keybindings.moveForward]) {      
                    // If the sprint key is down, try to sprint
                    if (input.keyboard[keybindings.sprint]) {
                        hero.stateMachine.requestTransitionTo(CharacterStates.Sprinting)
                    }
                    // Otherwise just walk
                    else {
                        hero.stateMachine.requestTransitionTo(CharacterStates.Walking)
                    }
                }
                if (input.keyboard[keybindings.strafeLeft]) {
                    // hero.mesh.translateX(1 * delta);
                }
                if (input.keyboard[keybindings.strafeRight]) {
                    // hero.mesh.translateX(-1 * delta);
                }
                if (input.keyboard[keybindings.moveBackward]) {

                }
                if (input.keyboard[keybindings.jump]) {
                    hero.stateMachine.requestTransitionTo(CharacterStates.Jumping);
                }


                if (this.character.stateMachine.current == CharacterStates.Attacking) {
                    this.character.stateMachine.requestTransitionTo(CharacterStates.Sheathing);
                }


                hero.stateMachine.requestTransitionTo(CharacterStates.Falling);
                hero.stateMachine.requestTransitionTo(CharacterStates.Idle);
                // Update the state machine before trying to reset it back to falling / idle
                hero.stateMachine.states[hero.stateMachine.current].update(delta, hero);
            }

            public update(delta: number, world: World): void {
                if (this.script) {
                    this.script.update(this.character, world, delta);
                    this.character.stateMachine.update(delta);
                }
            }
        }
    }
} 