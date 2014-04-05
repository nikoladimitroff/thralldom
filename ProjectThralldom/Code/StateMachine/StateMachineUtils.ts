module Thralldom {
    export class StateMachineUtils {

        private static FallingExitMultiplier = 0.6;
        private static FallingEntranceMultiplier = 0.45;
        private static JumpingErrorMargin = 1;

        private static dummyEventHandler = (state: number, object: DynamicObject) => { };
        private static dummyPredicate = (object: DynamicObject) => false;

        // MEMLEAK
        private static _jumpingImpulse: Ammo.btVector3;
        private static get JumpingImpulse(): Ammo.btVector3 {
            if (!StateMachineUtils._jumpingImpulse) {
                StateMachineUtils._jumpingImpulse = new Ammo.btVector3(0, Character.defaultSettings.jumpImpulse, 0);
            }
            return StateMachineUtils._jumpingImpulse;
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

                character.weapon.animation.stop();
                character.weapon.animation.play(startTime);

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
                character.weapon.animation.stop();
                var startTime = Utilities.convertFrameToTime(character.animationData[character.getAnimationName()].startFrame, character.animation);
                character.animation.play(startTime);
                character.weapon.animation.play(startTime);
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
                var velocity = hero.rigidBody.getLinearVelocity();

                return !walking.data.isWalking// && GeometryUtils.almostZero(velocity.x()) && GeometryUtils.almostZero(velocity.z());
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

                var velocity = hero.setWalkingVelocity(delta, true);

                sprinting.data.isSprinting = false;
            }

            var sprintingExit = (next: number, hero: Character): void => {
                if (next != CharacterStates.Sprinting) {
                    AudioManager.instance.stopSound("Sprinting", hero.mesh.id);
                }
            }

            var sprintingInterupt = (hero: Character): boolean => {
                var velocity = hero.rigidBody.getLinearVelocity();
                return !sprinting.data.isSprinting //&& GeometryUtils.almostZero(velocity.x()) && GeometryUtils.almostZero(velocity.z());
            };

            sprinting = new State(CharacterStates.Sprinting, sprintingUpdate, sprintingEntry, sprintingExit, sprintingInterupt);

            return sprinting;
        }

        private static getJumpingState(): State {
            var jumping: State;

            var jumpingEntry = (previous: number, hero: Character) => {
                jumping.data.beforeJumpY = hero.mesh.position.y;
                jumping.data.reachedPeak = false;
                //object.rigidBody.applyCentralImpulse(StateMachineUtils.JumpingImpulse);

                var velocity = hero.rigidBody.getLinearVelocity();
                velocity.setY(Character.defaultSettings.jumpImpulse);
                StateMachineUtils.restartAnimationIfNeeded(hero, previous);

            }

            var jumpingUpdate = (delta: number, hero: Character) => {
                StateMachineUtils.ensureAnimationLoop(hero);

                var velocity = hero.rigidBody.getLinearVelocity().y()
                if (!jumping.data.reachedPeak && velocity < 0) {
                    jumping.data.reachedPeak = true;
                    jumping.data.peak = hero.mesh.position.y;
                }
                jumping.data.previousY = hero.mesh.position.y;
                jumping.data.previousVelY = velocity;
            }

            var jumpingInterupt = (object: DynamicObject): boolean => {
                var precision = PhysicsManager.defaultSettings.gravity * StateMachineUtils.FallingExitMultiplier;

                var velocityY = object.rigidBody.getLinearVelocity().y();
                var jumpFinished =
                    GeometryUtils.almostZero(velocityY, precision) &&
                    jumping.data.reachedPeak &&
                    Math.abs(object.mesh.position.y - jumping.data.peak) > StateMachineUtils.JumpingErrorMargin;
                var samePosition =
                    GeometryUtils.almostEquals(object.mesh.position.y, jumping.data.previousY, 0.1) &&
                    GeometryUtils.almostEquals(velocityY, jumping.data.previousVelY);

                return jumpFinished || samePosition;
            };

            jumping = new State(CharacterStates.Jumping, jumpingUpdate, jumpingEntry, StateMachineUtils.dummyEventHandler, jumpingInterupt);

            return jumping;
        }

        private static getFallingState(): State {
            var falling: State;

            var fallingInterupt = (object: DynamicObject): boolean => {
                var precision = PhysicsManager.defaultSettings.gravity * StateMachineUtils.FallingExitMultiplier;
                var velocityY = object.rigidBody.getLinearVelocity().y();
                // Negative velocity that is close to zero
                return velocityY < 0 &&
                    GeometryUtils.almostZero(velocityY, precision);
            };

            var fallingEntranceCondition = (object: DynamicObject): boolean => {
                var velocityY = object.rigidBody.getLinearVelocity().y();
                // Negative velocity bigger than gravity * gravityMultiplier
                return velocityY < 0 && velocityY < PhysicsManager.defaultSettings.gravity * StateMachineUtils.FallingEntranceMultiplier;
            }

            falling = new State(CharacterStates.Falling,
                State.emptyUpdate,
                StateMachineUtils.dummyEventHandler,
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
            worldFrom.sub(hero.rigidBody.centerToMesh);

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