module Thralldom {
    export class StateMachineUtils {

        private static FallingGravityMultiplier = 0.3;
        private static StopFallingVelocityMultiplier = 0.6;
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
            var animationData = character.animationData[character.stateMachine.current];

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
            var animationData = character.animationData[character.stateMachine.current];

            var startTime = Utilities.convertFrameToTime(animationData.startFrame, animation);
            var endTime = Utilities.convertFrameToTime(animationData.endFrame, animation);

            if (animation.currentTime >= endTime && !animation.isPaused) {
                animation.pause();
                character.weapon.animation.pause();

                return true;
            }
            return false;
        }

        private static restartAnimationIfNeeded(character: Character, previousState: number, currentState: number): void {
            if (previousState != currentState) {
                character.animation.stop();
                character.weapon.animation.stop();
                var startTime = Utilities.convertFrameToTime(character.animationData[currentState].startFrame, character.animation);
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

                StateMachineUtils.restartAnimationIfNeeded(hero, previous, CharacterStates.Walking);
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

                StateMachineUtils.restartAnimationIfNeeded(hero, previous, CharacterStates.Sprinting);

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

            var jumpingEntry = (previous: number, object: DynamicObject) => {
                jumping.data.beforeJumpY = object.mesh.position.y;
                jumping.data.reachedPeak = false;
                //object.rigidBody.applyCentralImpulse(StateMachineUtils.JumpingImpulse);

                var velocity = object.rigidBody.getLinearVelocity();
                velocity.setY(Character.defaultSettings.jumpImpulse);

            }

            var jumpingUpdate = (delta: number, object: DynamicObject) => {
                var velocity = object.rigidBody.getLinearVelocity().y()
                if (!jumping.data.reachedPeak && velocity < 0) {
                    jumping.data.reachedPeak = true;
                    jumping.data.peak = object.mesh.position.y;
                }
                jumping.data.previousY = object.mesh.position.y;
                jumping.data.previousVelY = velocity;
            }

            var jumpingInterupt = (object: DynamicObject): boolean => {
                var precision = PhysicsManager.defaultSettings.gravity * StateMachineUtils.FallingGravityMultiplier;
                var velocity = object.rigidBody.getLinearVelocity().y();
                var jumpFinished =
                    GeometryUtils.almostZero(velocity, precision) &&
                    jumping.data.reachedPeak &&
                    Math.abs(object.mesh.position.y - jumping.data.peak) > StateMachineUtils.JumpingErrorMargin;
                var samePosition =
                    object.mesh.position.y == jumping.data.previousY &&
                    velocity == jumping.data.previousVelY;

                return jumpFinished;
            };

            jumping = new State(CharacterStates.Jumping, jumpingUpdate, jumpingEntry, StateMachineUtils.dummyEventHandler, jumpingInterupt);

            return jumping;
        }

        private static getFallingState(): State {
            var falling: State;

            var fallingInterupt = (object: DynamicObject): boolean => {
                var precision = PhysicsManager.defaultSettings.gravity * StateMachineUtils.FallingGravityMultiplier
                var velocityY = object.rigidBody.getLinearVelocity().y();
                // Negative velocity that is close to zero
                return velocityY < 0 &&
                    GeometryUtils.almostZero(velocityY, precision);
            };

            var fallingEntranceCondition = (object: DynamicObject): boolean => {
                var velocityY = object.rigidBody.getLinearVelocity().y();
                // Negative velocity bigger than gravity * gravityMultiplier (0.6 looks ok)
                return velocityY < 0 && velocityY < PhysicsManager.defaultSettings.gravity * StateMachineUtils.FallingGravityMultiplier;
            }

            falling = new State(CharacterStates.Falling,
                State.emptyUpdate,
                StateMachineUtils.dummyEventHandler,
                StateMachineUtils.dummyEventHandler,
                fallingInterupt,
                fallingEntranceCondition);

            return falling;
        }

        private static getShootingState(): State {
            var shooting: State;

            var shootingEntry = (previous: number, hero: Character): void => {

                AudioManager.instance.playSound("Shooting", hero.mesh, false, false);


                StateMachineUtils.restartAnimationIfNeeded(hero, previous, CharacterStates.Shooting);
                shooting.data.animationFinished = false;
            }

            var shootingUpdate = (delta: number, hero: Character): void => {
                shooting.data.animationFinished =
                    shooting.data.animationFinished ||
                    StateMachineUtils.ensureAnimationLoop(hero);
            }

            var shootingExit = (next: number, hero: Character): void => {

            }

            var shootingInterupt = (hero: Character): boolean => {
                return shooting.data.animationFinished;
            };

            shooting = new State(CharacterStates.Shooting, shootingUpdate, shootingEntry, shootingExit, shootingInterupt);

            return shooting;
        }

        private static getDyingState(): State {
            var dying: State;

            var dyingEntry = (previous: number, hero: Character): void => {
                StateMachineUtils.restartAnimationIfNeeded(hero, previous, CharacterStates.Dying);
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
            transitions[CharacterStates.Idle] = [CharacterStates.Dying, CharacterStates.Jumping, CharacterStates.Falling, CharacterStates.Shooting, CharacterStates.Sprinting, CharacterStates.Walking];
            transitions[CharacterStates.Walking] = [CharacterStates.Dying, CharacterStates.Jumping, CharacterStates.Falling, CharacterStates.Shooting, CharacterStates.Walking, CharacterStates.Sprinting];
            transitions[CharacterStates.Sprinting] = [CharacterStates.Dying, CharacterStates.Jumping, CharacterStates.Falling, CharacterStates.Walking];
            transitions[CharacterStates.Shooting] = [CharacterStates.Dying];
            transitions[CharacterStates.Dying] = [];
            transitions[CharacterStates.Jumping] = [CharacterStates.Dying];
            transitions[CharacterStates.Falling] = [CharacterStates.Dying];


            var idleEntry = (previous: number, hero: Character): void => {
                StateMachineUtils.restartAnimationIfNeeded(hero, previous, CharacterStates.Idle);

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
            var shooting = StateMachineUtils.getShootingState();
            var dying = StateMachineUtils.getDyingState();

            var states = [idle, sprinting, shooting, dying, jumping, falling, walking].sort((x, y) => x.index - y.index);

            return new StateMachine(states, transitions, character);

        }

        public static translateState(index: number): string {
            return CharacterStates[index] || "No such state!";
        }
    }
}