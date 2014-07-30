module Thralldom {
    export module CharacterControllers {
        export class SkyrimCharacterController implements ICharacterController {
            public character: Character;
            public script: ScriptController;

            public get canInteract():  boolean {
                // viva la boolean evaluation!
                return this.interactionTarget !== undefined;
            }

            private interactionTarget: IInteractable;

            private raycastPromiseUid: number;

            constructor(hero: Character) {
                this.character = hero;
                this.raycastPromiseUid = -1;
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
                if (this.interactionTarget &&
                    input.keyboard[keybindings.interact] &&
                    !input.previousKeyboard[keybindings.interact]) {

                    this.interactionTarget.interact(hero);
                }


                if (this.character.stateMachine.current == CharacterStates.Attacking) {
                    this.character.stateMachine.requestTransitionTo(CharacterStates.Sheathing);
                }


                hero.stateMachine.requestTransitionTo(CharacterStates.Falling);
                hero.stateMachine.requestTransitionTo(CharacterStates.Idle);
                // Update the state machine before trying to reset it back to falling / idle
                hero.stateMachine.update(delta);
            }


            public handleInteraction(camera: CameraControllers.ICameraController, world: World): void {
                // See if our raycast request has been resolved. 
                var ray = PhysicsManager.instance.tryResolveRaycast(this.raycastPromiseUid);
                // If the request has been fullfilled, do stuff
                if (ray) {
                    // we have new information, delete the old interaction target
                    this.interactionTarget = undefined;
                    if (ray.hasHit && ray.collisionObjectId != this.character.mesh.id) {
                        var hitObject = <any>world.selectByPhysId(ray.collisionObjectId);
                        if (hitObject.interact && hitObject.interact.constructor == Function) {
                            this.interactionTarget = hitObject;
                        }
                    }
                    this.raycastPromiseUid = -1;
                }
                // If no request is currently pending, request another
                if (this.raycastPromiseUid == -1) {
                    var pos = new THREE.Vector3()
                    pos.subVectors(this.character.mesh.position, this.character.centerToMesh);
                    var cameraToHero = (new THREE.Vector3).subVectors(pos, camera.position);
                    var target = cameraToHero.normalize().multiplyScalar(this.character.range).add(pos);

                    this.raycastPromiseUid = PhysicsManager.instance.requestRaycast(pos, target);
                }
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