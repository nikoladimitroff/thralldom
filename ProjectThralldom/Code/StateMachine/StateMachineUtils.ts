module Thralldom {
    export class StateMachineUtils {

        private static FallingGravityMultiplier = 0.3;
        private static StopFallingVelocityMultiplier = 0.6;
        private static JumpingErrorMargin = 1;

        private static dummyEventHandler = (state: number, object: DynamicObject) => { };
        private static dummyPredicate = (object: DynamicObject) => false;

        private static getDummyState(index: number) {
            return new State(index, State.emptyUpdate, StateMachineUtils.dummyEventHandler, StateMachineUtils.dummyEventHandler, StateMachineUtils.dummyPredicate);
        }

        private static getWalkingState(): State {
            var walking: State;

            var walkingEntry = (previous: number, hero: Character): void => {
                if (previous != CharacterStates.Walking) {
                    hero.animation.stop();
                    var startFrame: number = hero.animationData[CharacterStates.Walking].startFrame;
                    var startTime = Utilities.convertFrameToTime(startFrame, hero.animation);
                    hero.animation.play(startTime);
                }
            }

            var walkingUpdate = (hero: Character): void => {
                var animData: IAnimationData = hero.animationData[CharacterStates.Walking];
                var startTime = Utilities.convertFrameToTime(animData.startFrame, hero.animation);
                var endTime = Utilities.convertFrameToTime(animData.endFrame, hero.animation);

                if (hero.animation.currentTime >= endTime) {
                    hero.animation.stop();
                    hero.animation.play(startTime);
                }
            }

            var walkingExit = (next: number, hero: Character): void => {
            }

            var walkingInterupt = (hero: Character): boolean => {
                var velocity = hero.rigidBody.getLinearVelocity();
                return GeometryUtils.almostZero(velocity.x()) && GeometryUtils.almostZero(velocity.z());
                };

            walking = new State(CharacterStates.Walking, walkingUpdate, walkingEntry, walkingExit, walkingInterupt);

            return walking;
        }

        private static getSprintingState(): State {
            var sprinting: State;

            var sprintingEntry = (previous: number, hero: Character): void => {
                if (previous != CharacterStates.Sprinting) {
                    hero.animation.stop();
                    var startFrame: number = hero.animationData[CharacterStates.Walking].startFrame;
                    var startTime = Utilities.convertFrameToTime(startFrame, hero.animation);
                    hero.animation.play(startTime);
                }
            }

            var sprintingUpdate = (hero: Character): void => {
                var animData: IAnimationData = hero.animationData[CharacterStates.Walking];
                var startTime = Utilities.convertFrameToTime(animData.startFrame, hero.animation);
                var endTime = Utilities.convertFrameToTime(animData.endFrame, hero.animation);

                if (hero.animation.currentTime >= endTime) {
                    hero.animation.stop();
                    hero.animation.play(startTime);
                }
            }

            var sprintingExit = (next: number, hero: Character): void => {
            }

            var sprintingInterupt = (hero: Character): boolean => {
                var velocity = hero.rigidBody.getLinearVelocity();
                return GeometryUtils.almostZero(velocity.x()) && GeometryUtils.almostZero(velocity.z());
            };

            sprinting = new State(CharacterStates.Sprinting, sprintingUpdate, sprintingEntry, sprintingExit, sprintingInterupt);

            return sprinting;
        }

        private static getJumpingState(): State {
            var jumping: State;

            var jumpingEntry = (previous: number, object: DynamicObject) => {
                jumping.data.beforeJumpY = object.mesh.position.y;
                jumping.data.reachedPeak = false;
                object.rigidBody.applyCentralImpulse(new Ammo.btVector3(0, Character.defaultSettings.jumpImpulse, 0));

            }

            var jumpingUpdate = (object: DynamicObject) => {
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

                return jumpFinished || samePosition;
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

        public static getCharacterStateMachine(character: Character): StateMachine {
            var transitions = new Array<Array<number>>();
            transitions[CharacterStates.Idle] = [CharacterStates.Dying, CharacterStates.Jumping, CharacterStates.Falling, CharacterStates.Shooting, CharacterStates.Sprinting, CharacterStates.Walking];
            transitions[CharacterStates.Walking] = [CharacterStates.Dying, CharacterStates.Jumping, CharacterStates.Falling, CharacterStates.Shooting, CharacterStates.Walking, CharacterStates.Sprinting];
            transitions[CharacterStates.Sprinting] = [CharacterStates.Dying, CharacterStates.Jumping, CharacterStates.Falling, CharacterStates.Walking];
            transitions[CharacterStates.Shooting] = [CharacterStates.Dying, CharacterStates.Idle];
            transitions[CharacterStates.Dying] = [];
            transitions[CharacterStates.Jumping] = [CharacterStates.Dying];
            transitions[CharacterStates.Falling] = [CharacterStates.Dying];

            var shooting = StateMachineUtils.getDummyState(CharacterStates.Shooting);
            var dying = StateMachineUtils.getDummyState(CharacterStates.Dying);

            var idleEntry = (previous: number, hero: Character): void => {
                hero.animation.stop();
                var startFrame = hero.animationData[CharacterStates.Idle].startFrame;
                var startTime = Utilities.convertFrameToTime(startFrame, hero.animation);
                hero.animation.play(startTime);
            }


            var idleUpdate = (hero: Character): void => {
                var animData: IAnimationData = hero.animationData[CharacterStates.Idle];
                var startTime = Utilities.convertFrameToTime(animData.startFrame, hero.animation);
                var endTime = Utilities.convertFrameToTime(animData.endFrame, hero.animation);

                if (hero.animation.currentTime >= endTime) {
                    hero.animation.stop();
                    hero.animation.play(startTime);
                }
            }

            var idle = new State(CharacterStates.Idle, idleUpdate, idleEntry, StateMachineUtils.dummyEventHandler, StateMachineUtils.dummyPredicate);
            var walking = StateMachineUtils.getWalkingState();
            var jumping = StateMachineUtils.getJumpingState();
            var falling = StateMachineUtils.getFallingState();
            var sprinting = StateMachineUtils.getSprintingState();
            
            var states = [idle, sprinting, shooting, dying, jumping, falling, walking].sort((x, y) => x.index - y.index);

            return new StateMachine(states, transitions, character);

        }

        public static translateState(index: number): string {
            return CharacterStates[index] || "No such state!";
        }
    }
}