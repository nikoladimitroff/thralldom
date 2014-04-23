module Thralldom {
    /*
     * TODOS:
     * IDLE AND FALLING ANIMATIONS NOT PLAYING
     * WEAPON ANIMATIONS NOT PLAYING
    */
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

        private static animationUpdate(delta: number, character: Character): boolean {
            var mainAnimation = character.activeAnimations[0];
            if (mainAnimation.weight == 1) {
                var modifier = 0.001//0.5 / (delta / 1000);
                mainAnimation.weight += modifier;
                character.activeAnimations[1] && (character.activeAnimations[1].weight -= modifier);
            }

            for (var i = character.activeAnimations.length - 1; i > 0; i--) {
                var anim = character.activeAnimations[i];
                if (anim.weight === 0) {
                    anim.loop = false;
                    anim.stop();
                    character.activeAnimations.splice(i, 1);
                }
            }


            return false;
        }

        private static playCurrentStateAnimation(character: Character, loop: boolean, previousState: number): void {
            if (previousState != character.stateMachine.current) {

                character.activeAnimations[0] && (character.activeAnimations[0].weight = 0.5);
                var animation: THREE.Animation = character.animations[character.getAnimationName()];
                animation.weight = 0.5;
                character.activeAnimations.unshift(animation);

                animation.loop = loop;
                var animData = character.animationData[CharacterState[character.stateMachine.current]];
                var startTime = Utilities.convertFrameToTime(animData.startFrame, animation);
                animation.play(startTime);


                //character.animation.stop();
                //character.weapon.animation.stop();
                //character.animation.play(startTime);
                //character.weapon.animation.play(startTime);
            }
        }

        private static getWalkingState(): State {
            var walking: State;

            var walkingEntry = (previous: number, hero: Character): void => {

                if (previous != CharacterState.Walking) {
                    AudioManager.instance.playSound("Walking", hero.mesh, true, false);
                }

                StateMachineUtils.playCurrentStateAnimation(hero, true, previous);
                walking.data.isWalking = true;
            }

            var walkingUpdate = (delta: number, hero: Character): void => {
                StateMachineUtils.animationUpdate(delta, hero);

                hero.setWalkingVelocity(delta);

                walking.data.isWalking = false;
            }

            var walkingExit = (next: number, hero: Character): void => {
                if (next != CharacterState.Walking)
                    AudioManager.instance.stopSound("Walking", hero.mesh.id);
            }

            var walkingInterupt = (hero: Character): boolean => {

                return !walking.data.isWalking// && GeometryUtils.almostZero(velocity.x()) && GeometryUtils.almostZero(velocity.z());
            }

            walking = new State(CharacterState.Walking, walkingUpdate, walkingEntry, walkingExit, walkingInterupt);

            return walking;
        }

        private static getSprintingState(): State {
            var sprinting: State;

            var sprintingEntry = (previous: number, hero: Character): void => {

                if (previous != CharacterState.Sprinting) {
                    AudioManager.instance.playSound("Sprinting", hero.mesh, true, false);
                }

                StateMachineUtils.playCurrentStateAnimation(hero, true, previous);

                sprinting.data.isSprinting = true;
            }

            var sprintingUpdate = (delta: number, hero: Character): void => {

                StateMachineUtils.animationUpdate(delta, hero);

                hero.setWalkingVelocity(delta, true);

                sprinting.data.isSprinting = false;
            }

            var sprintingExit = (next: number, hero: Character): void => {
                if (next != CharacterState.Sprinting) {
                    AudioManager.instance.stopSound("Sprinting", hero.mesh.id);
                }
            }

            var sprintingInterupt = (hero: Character): boolean => {
                return !sprinting.data.isSprinting;
            };

            sprinting = new State(CharacterState.Sprinting, sprintingUpdate, sprintingEntry, sprintingExit, sprintingInterupt);

            return sprinting;
        }

        private static getJumpingState(): State {
            var jumping: State;

            var jumpingEntry = (previous: number, hero: Character) => {
                var impulse = new THREE.Vector3();
                StateMachineUtils.GetJumpingImpulse(impulse, hero);
                PhysicsManager.instance.applyImpulse(hero.mesh.id, impulse);

                StateMachineUtils.playCurrentStateAnimation(hero, false, previous);
            }

            var jumpingUpdate = (delta: number, hero: Character) => {

                if (jumping.data.previous == CharacterState.Walking || jumping.data.previous == CharacterState.Sprinting)
                    hero.setWalkingVelocity(delta, jumping.data.previous == CharacterState.Sprinting);

            }

            var jumpingInterupt = (object: DynamicObject): boolean => {

                return !object.isAirborne;
            };

            jumping = new State(CharacterState.Jumping, jumpingUpdate, jumpingEntry, StateMachineUtils.dummyEventHandler, jumpingInterupt);

            return jumping;
        }

        private static getFallingState(): State {
            var falling: State;

            var fallingEntry = (previous: number, hero: DynamicObject): void => {
                //StateMachineUtils.playCurrentStateAnimation(<any>hero, false, previous);
            }

            var fallingUpdate = (delta: number, hero: Character): void => {
                //StateMachineUtils.animationUpdate(delta, hero);
            }


            var fallingInterupt = (object: DynamicObject): boolean => {
                return !object.isAirborne;
            };

            var fallingEntranceCondition = (hero: Character): boolean => {
                return hero.stateMachine.current != CharacterState.Jumping && hero.isAirborne;
            }

            falling = new State(CharacterState.Falling,
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
                StateMachineUtils.playCurrentStateAnimation(hero, false, previous);
                unsheating.data.animationFinished = false;
            }

            var update = (delta: number, hero: Character): void => {
                unsheating.data.animationFinished =
                    unsheating.data.animationFinished ||
                    StateMachineUtils.animationUpdate(delta, hero);

                if (unsheating.data.animationFinished) {
                    hero.stateMachine.requestTransitionTo(CharacterState.Attacking);
                }
            }

            var exit = (next: number, hero: Character): void => {
            }

            var interupt = (hero: Character): boolean => {
                return unsheating.data.animationFinished;
            };

            unsheating = new State(CharacterState.Unsheathing, update, entry, exit, interupt);

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
                if (previous == CharacterState.Attacking) {
                    attacking.data.doubleAttack = true;
                }
                else {
                    StateMachineUtils.shootBullet(hero);
                    AudioManager.instance.playSound(hero.getAnimationName(), hero.mesh, false, false);
                }


                StateMachineUtils.playCurrentStateAnimation(hero, false, previous);
                attacking.data.animationFinished = false;
            }

            var update = (delta: number, hero: Character): void => {
                var animationLooped = StateMachineUtils.animationUpdate(delta, hero);
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
                    hero.stateMachine.requestTransitionTo(CharacterState.Sheathing);
                }
            }

            var exit = (next: number, hero: Character): void => {
            }

            var interupt = (hero: Character): boolean => {
                return attacking.data.animationFinished && !attacking.data.doubleAttack;
            };

            attacking = new State(CharacterState.Attacking, update, entry, exit, interupt);

            return attacking;
        }


        private static getSheatingState(): State {
            var sheating: State;

            var entry = (previous: number, hero: Character): void => {
                StateMachineUtils.playCurrentStateAnimation(hero, false, previous);
                sheating.data.animationFinished = false;
            }

            var update = (delta: number, hero: Character): void => {
                sheating.data.animationFinished =
                    sheating.data.animationFinished ||
                    StateMachineUtils.animationUpdate(delta, hero);
            }

            var exit = (next: number, hero: Character): void => {

            }

            var interupt = (hero: Character): boolean => {
                return sheating.data.animationFinished;
            };

            sheating = new State(CharacterState.Sheathing, update, entry, exit, interupt);

            return sheating;
        }

        private static getDyingState(): State {
            var dying: State;

            var dyingEntry = (previous: number, hero: Character): void => {
                StateMachineUtils.playCurrentStateAnimation(hero, false, previous);
                dying.data.animationFinished = false;
            }

            var dyingUpdate = (delta: number, hero: Character): void => {

            }

            var dyingExit = (next: number, hero: Character): void => {
            }

            var dyingInterupt = (hero: Character): boolean => {
                return false;
            };

            dying = new State(CharacterState.Dying, dyingUpdate, dyingEntry, dyingExit, dyingInterupt);

            return dying;
        }

        public static getCharacterStateMachine(character: Character): StateMachine {
            var transitions = new Array<Array<number>>();
            transitions[CharacterState.Idle] = [CharacterState.Dying, CharacterState.Jumping, CharacterState.Falling, CharacterState.Unsheathing, CharacterState.Sprinting, CharacterState.Walking];
            transitions[CharacterState.Walking] = [CharacterState.Dying, CharacterState.Jumping, CharacterState.Falling, CharacterState.Unsheathing, CharacterState.Walking, CharacterState.Sprinting];
            transitions[CharacterState.Sprinting] = [CharacterState.Dying, CharacterState.Jumping, CharacterState.Falling, CharacterState.Walking];
            transitions[CharacterState.Unsheathing] = [CharacterState.Dying];
            transitions[CharacterState.Attacking] = [CharacterState.Dying, CharacterState.Attacking];
            transitions[CharacterState.Sheathing] = [CharacterState.Dying];
            transitions[CharacterState.Dying] = [];
            transitions[CharacterState.Jumping] = [CharacterState.Dying];
            transitions[CharacterState.Falling] = [CharacterState.Dying];


            var idleEntry = (previous: number, hero: Character): void => {
                //StateMachineUtils.playCurrentStateAnimation(hero, true, previous);

                hero.setWalkingVelocity(0);
            }


            var idleUpdate = (delta: number, hero: Character): void => {
                //StateMachineUtils.animationUpdate(delta, hero);
            }

            var idle = new State(CharacterState.Idle, idleUpdate, idleEntry, StateMachineUtils.dummyEventHandler, StateMachineUtils.dummyPredicate);
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
            return CharacterState[index] || "No such state!";
        }
    }
}