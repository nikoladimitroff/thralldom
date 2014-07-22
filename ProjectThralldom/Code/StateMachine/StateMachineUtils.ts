module Thralldom {
    export class StateMachineUtils {
        private static FallingExitMultiplier = 1 + 1e-4;
        private static JumpingErrorMargin = 3;

        private static dummyEventHandler = (state: number, object: DynamicObject) => { };
        private static dummyPredicate = (object: DynamicObject) => false;

        // MEMLEAK
        private static _jumpingImpulse: THREE.Vector3;
        private static GetJumpingImpulse(vector: THREE.Vector3, hero: Character): void {
            vector.set(0, hero.settings.jumpImpulse, 0);
        }

        private static getDummyState(index: number): State {
            return new State(index, State.emptyUpdate, StateMachineUtils.dummyEventHandler, StateMachineUtils.dummyEventHandler, StateMachineUtils.dummyPredicate);
        }

        private static ensureAnimationLoop(character: Character): boolean {
            var animation = character.animation;
            // WARNING: This will work for now, but once we have multiple weapon animations it will fail
            var animationData = character.animationData[character.getAnimationName()];

            var startTime = Utilities.convertFrameToTime(animationData.startFrame, animation);
            var endTime = Utilities.convertFrameToTime(animationData.endFrame, animation);

            if (animation.currentTime >= endTime) {
                animation.stop();
                animation.play(startTime);

                if (character.weapon) {
                    character.weapon.animation.stop();
                    character.weapon.animation.play(startTime);
                }

                return true;
            }
            return false;
        }

        private static pauseAnimationAfterEnd(character: Character): boolean {
            var animation = character.animation;
            var animationData = character.animationData[character.getAnimationName()];

            var startTime = Utilities.convertFrameToTime(animationData.startFrame, animation);
            var endTime = Utilities.convertFrameToTime(animationData.endFrame, animation);

            if (animation.currentTime >= endTime && !animation.isPaused) {
                animation.pause();
                character.weapon.animation.pause();

                return true;
            }
            return false;
        }

        private static restartAnimationIfNeeded(character: Character, previousState: number): void {
            if (previousState != character.stateMachine.current) {
                character.animation.stop();
                var startTime = Utilities.convertFrameToTime(character.animationData[character.getAnimationName()].startFrame, character.animation);
                character.animation.play(startTime);
                if (character.weapon) {
                    character.weapon.animation.stop();
                    character.weapon.animation.play(startTime);
                }
            }

        }

        private static getWalkingState(): State {
            var walking: State;

            var walkingEntry = (previous: number, hero: Character): void => {

                if (previous != CharacterStates.Walking) {
                    AudioManager.instance.playSound("Walking", hero.mesh, true, false);
                }

                StateMachineUtils.restartAnimationIfNeeded(hero, previous);
                walking.data.isWalking = true;
            }

            var walkingUpdate = (delta: number, hero: Character): void => {
                StateMachineUtils.ensureAnimationLoop(hero);

                hero.setWalkingVelocity(delta);

                walking.data.isWalking = false;
            }

            var walkingExit = (next: number, hero: Character): void => {
                if (next != CharacterStates.Walking)
                    AudioManager.instance.stopSound("Walking", hero.mesh.id);
            }

            var walkingInterupt = (hero: Character): boolean => {
                return !walking.data.isWalking;
            }

            walking = new State(CharacterStates.Walking, walkingUpdate, walkingEntry, walkingExit, walkingInterupt);

            return walking;
        }

        private static getSprintingState(): State {
            var sprinting: State;

            var sprintingEntry = (previous: number, hero: Character): void => {

                if (previous != CharacterStates.Sprinting) {
                    AudioManager.instance.playSound("Sprinting", hero.mesh, true, false);
                }

                StateMachineUtils.restartAnimationIfNeeded(hero, previous);

                sprinting.data.isSprinting = true;
            }

            var sprintingUpdate = (delta: number, hero: Character): void => {

                StateMachineUtils.ensureAnimationLoop(hero);

                hero.setWalkingVelocity(delta, true);

                sprinting.data.isSprinting = false;
            }

            var sprintingExit = (next: number, hero: Character): void => {
                if (next != CharacterStates.Sprinting) {
                    AudioManager.instance.stopSound("Sprinting", hero.mesh.id);
                }
            }

            var sprintingInterupt = (hero: Character): boolean => {
                return !sprinting.data.isSprinting;
            };

            sprinting = new State(CharacterStates.Sprinting, sprintingUpdate, sprintingEntry, sprintingExit, sprintingInterupt);

            return sprinting;
        }

        private static getJumpingState(): State {
            var jumping: State;

            var jumpingEntry = (previous: number, hero: Character) => {
                var impulse = new THREE.Vector3();
                StateMachineUtils.GetJumpingImpulse(impulse, hero);
                PhysicsManager.instance.applyImpulse(hero.mesh.id, impulse);

                StateMachineUtils.restartAnimationIfNeeded(hero, previous);
            }

            var jumpingUpdate = (delta: number, hero: Character) => {
                StateMachineUtils.pauseAnimationAfterEnd(hero);

                if (jumping.data.previous == CharacterStates.Walking || jumping.data.previous == CharacterStates.Sprinting)
                    hero.setWalkingVelocity(delta, jumping.data.previous == CharacterStates.Sprinting);

            }

            var jumpingInterupt = (object: DynamicObject): boolean => {

                return !object.isAirborne;
            };

            jumping = new State(CharacterStates.Jumping, jumpingUpdate, jumpingEntry, StateMachineUtils.dummyEventHandler, jumpingInterupt);

            return jumping;
        }

        private static getFallingState(): State {
            var falling: State;

            var fallingEntry = (previous: number, hero: DynamicObject): void => {
                StateMachineUtils.restartAnimationIfNeeded(<any>hero, previous);
            }

            var fallingUpdate = (delta: number, hero: Character): void => {
                StateMachineUtils.pauseAnimationAfterEnd(hero);
            }


            var fallingInterupt = (object: DynamicObject): boolean => {
                return !object.isAirborne;
            };

            var fallingEntranceCondition = (hero: Character): boolean => {
                return hero.stateMachine.current != CharacterStates.Jumping && hero.isAirborne;
            }

            falling = new State(CharacterStates.Falling,
                fallingUpdate,
                fallingEntry,
                StateMachineUtils.dummyEventHandler,
                fallingInterupt,
                fallingEntranceCondition);

            return falling;
        }

        private static getUnsheatingState(): State {
            var unsheating: State;

            var entry = (previous: number, hero: Character): void => {
                StateMachineUtils.restartAnimationIfNeeded(hero, previous);
                unsheating.data.animationFinished = false;
            }

            var update = (delta: number, hero: Character): void => {
                unsheating.data.animationFinished =
                    unsheating.data.animationFinished ||
                    StateMachineUtils.ensureAnimationLoop(hero);

                if (unsheating.data.animationFinished) {
                    hero.stateMachine.requestTransitionTo(CharacterStates.Attacking);
                }
            }

            var exit = (next: number, hero: Character): void => {
            }

            var interupt = (hero: Character): boolean => {
                return unsheating.data.animationFinished;
            };

            unsheating = new State(CharacterStates.Unsheathing, update, entry, exit, interupt);

            return unsheating;
        }

        private static shootBullet(hero: Character): void {
            var forward = new THREE.Vector3(0, 0, 1);
            forward.transformDirection(hero.mesh.matrix);
            var worldFrom = new THREE.Vector3();
            worldFrom.applyMatrix4((<any>hero.weapon.mesh).matrixWorld);
            worldFrom.sub(hero.centerToMesh);

            hero.weapon.attack(worldFrom, forward);
        }

        private static getAttackingState(): State {
            var attacking: State;

            var entry = (previous: number, hero: Character): void => {
                // Double attack incoming, queue it
                if (previous == CharacterStates.Attacking) {
                    attacking.data.doubleAttack = true;
                }
                else {
                    StateMachineUtils.shootBullet(hero);
                    AudioManager.instance.playSound(hero.getAnimationName(), hero.mesh, false, false);
                }


                StateMachineUtils.restartAnimationIfNeeded(hero, previous);
                attacking.data.animationFinished = false;
            }

            var update = (delta: number, hero: Character): void => {
                var animationLooped = StateMachineUtils.ensureAnimationLoop(hero);
                if (animationLooped && attacking.data.doubleAttack) {
                    attacking.data.animationFinished = false;
                    attacking.data.doubleAttack = false;
                    StateMachineUtils.shootBullet(hero);
                    AudioManager.instance.playSound(hero.getAnimationName(), hero.mesh, false, false);
                }
                else {
                    attacking.data.animationFinished =
                        attacking.data.animationFinished || animationLooped;
                }

                if (attacking.data.animationFinished) {
                    hero.stateMachine.requestTransitionTo(CharacterStates.Sheathing);
                }
            }

            var exit = (next: number, hero: Character): void => {
            }

            var interupt = (hero: Character): boolean => {
                return attacking.data.animationFinished && !attacking.data.doubleAttack;
            };

            attacking = new State(CharacterStates.Attacking, update, entry, exit, interupt);

            return attacking;
        }

        private static getSheatingState(): State {
            var sheating: State;

            var entry = (previous: number, hero: Character): void => {
                StateMachineUtils.restartAnimationIfNeeded(hero, previous);
                sheating.data.animationFinished = false;
            }

            var update = (delta: number, hero: Character): void => {
                sheating.data.animationFinished =
                    sheating.data.animationFinished ||
                    StateMachineUtils.ensureAnimationLoop(hero);
            }

            var exit = (next: number, hero: Character): void => {

            }

            var interupt = (hero: Character): boolean => {
                return sheating.data.animationFinished;
            };

            sheating = new State(CharacterStates.Sheathing, update, entry, exit, interupt);

            return sheating;
        }

        private static getDyingState(): State {
            var dying: State;

            var dyingEntry = (previous: number, hero: Character): void => {
                StateMachineUtils.restartAnimationIfNeeded(hero, previous);
                dying.data.animationFinished = false;
            }

            var dyingUpdate = (delta: number, hero: Character): void => {
                StateMachineUtils.pauseAnimationAfterEnd(hero);
            }

            var dyingExit = (next: number, hero: Character): void => {
            }

            var dyingInterupt = (hero: Character): boolean => {
                return false;
            };

            dying = new State(CharacterStates.Dying, dyingUpdate, dyingEntry, dyingExit, dyingInterupt);

            return dying;
        }

        public static getCharacterStateMachine(character: Character): StateMachine {
            var transitions = new Array<Array<number>>();
            transitions[CharacterStates.Idle] = [CharacterStates.Dying, CharacterStates.Jumping, CharacterStates.Falling, CharacterStates.Unsheathing, CharacterStates.Sprinting, CharacterStates.Walking];
            transitions[CharacterStates.Walking] = [CharacterStates.Dying, CharacterStates.Jumping, CharacterStates.Falling, CharacterStates.Unsheathing, CharacterStates.Walking, CharacterStates.Sprinting];
            transitions[CharacterStates.Sprinting] = [CharacterStates.Dying, CharacterStates.Jumping, CharacterStates.Falling, CharacterStates.Walking];
            transitions[CharacterStates.Unsheathing] = [CharacterStates.Dying];
            transitions[CharacterStates.Attacking] = [CharacterStates.Dying, CharacterStates.Attacking];
            transitions[CharacterStates.Sheathing] = [CharacterStates.Dying];
            transitions[CharacterStates.Dying] = [];
            transitions[CharacterStates.Jumping] = [CharacterStates.Dying];
            transitions[CharacterStates.Falling] = [CharacterStates.Dying];


            var idleEntry = (previous: number, hero: Character): void => {
                StateMachineUtils.restartAnimationIfNeeded(hero, previous);

                hero.setWalkingVelocity(0);
            }


            var idleUpdate = (delta: number, hero: Character): void => {
                StateMachineUtils.ensureAnimationLoop(hero);
            }

            var idle = new State(CharacterStates.Idle, idleUpdate, idleEntry, StateMachineUtils.dummyEventHandler, StateMachineUtils.dummyPredicate);
            var walking = StateMachineUtils.getWalkingState();
            var jumping = StateMachineUtils.getJumpingState();
            var falling = StateMachineUtils.getFallingState();
            var sprinting = StateMachineUtils.getSprintingState();
            var unsheating = StateMachineUtils.getUnsheatingState();
            var attacking = StateMachineUtils.getAttackingState();
            var sheating = StateMachineUtils.getSheatingState();
            var dying = StateMachineUtils.getDyingState();

            var states = [idle, sprinting, unsheating, attacking, sheating, dying, jumping, falling, walking].sort((x, y) => x.index - y.index);

            return new StateMachine(states, transitions, character);

        }

        public static translateState(index: number): string {
            return CharacterStates[index] || "No such state!";
        }
    }
}