module Thralldom {
    export class StateMachineUtils {

        private static FallingGravityMultiplier = 0.6;
        private static StopFallingVelocityTreshold = 1;
        private static JumpingErrorMargin = 1;

        private static dummyEventHandler = (state: number, object: DynamicObject) => { };
        private static dummyPredicate = (object: DynamicObject) => false;

        private static getDummyState(index: number) {
            return new State(index, StateMachineUtils.dummyEventHandler, StateMachineUtils.dummyEventHandler, StateMachineUtils.dummyPredicate);
        }

        private static getWalkingState(): State {
            var walking: State;

            var walkingEntry = (previous: number, hero: Character): void => {
                if (previous != CharacterStates.Walking)
                    hero.animation.play();

                walking.data.lastTime = hero.animation.currentTime;
            }

            var walkingExit = (next: number, hero: Character): void => {
                hero.animation.pause();
            }

            var walkingInterupt = (hero: Character) => {
                var velocity = hero.rigidBody.getLinearVelocity();
                return GeometryUtils.almostZero(velocity.x()) && GeometryUtils.almostZero(velocity.z());
                };

            walking = new State(CharacterStates.Walking, walkingEntry, walkingExit, walkingInterupt);

            return walking;
        }

        private static getJumpingState(): State {
            var jumping: State;

            var jumpingEntry = (previous: number, object: DynamicObject) => {
                jumping.data.beforeJumpY = object.mesh.position.y;
                object.rigidBody.applyCentralImpulse(new Ammo.btVector3(0, Character.CharacterJumpImpulseY, 0));

            }

            var jumpingInterupt = (object: DynamicObject): boolean =>
                object.rigidBody.getLinearVelocity().y() < 0 &&
                Math.abs(object.mesh.position.y - jumping.data.beforeJumpY) < StateMachineUtils.JumpingErrorMargin;

            jumping = new State(CharacterStates.Jumping, jumpingEntry, StateMachineUtils.dummyEventHandler, jumpingInterupt);

            return jumping;
        }

        private static getFallingState(): State {
            var falling: State;

            var fallingInterupt = (object: DynamicObject): boolean => {
                var velocityY = object.rigidBody.getLinearVelocity().y();
                // Negative velocity that is close to zero (less than -1)
                return velocityY < 0 && -velocityY < StateMachineUtils.StopFallingVelocityTreshold;
            };

            var fallingEntranceCondition = (object: DynamicObject): boolean => {
                var velocityY = object.rigidBody.getLinearVelocity().y();
                // Negative velocity bigger than gravity * gravityMultiplier (0.6 looks ok)
                return velocityY < 0 && velocityY < PhysicsManager.gravityAcceleration * StateMachineUtils.FallingGravityMultiplier;
            }

            falling = new State(CharacterStates.Falling,
                StateMachineUtils.dummyEventHandler,
                StateMachineUtils.dummyEventHandler,
                fallingInterupt,
                fallingEntranceCondition);

            return falling;
        }

        public static getCharacterStateMachine(character: Character): StateMachine {
            var transitions = new Array<Array<number>>();
            transitions[CharacterStates.Idle] = [CharacterStates.Dying, CharacterStates.Jumping, CharacterStates.Falling, CharacterStates.Shooting, CharacterStates.Sprinting, CharacterStates.Walking];
            transitions[CharacterStates.Walking] = [CharacterStates.Dying, CharacterStates.Walking, CharacterStates.Jumping, CharacterStates.Falling, CharacterStates.Shooting, CharacterStates.Sprinting];
            transitions[CharacterStates.Sprinting] = [CharacterStates.Dying, CharacterStates.Idle, CharacterStates.Jumping, CharacterStates.Falling, CharacterStates.Walking];
            transitions[CharacterStates.Shooting] = [CharacterStates.Dying, CharacterStates.Idle];
            transitions[CharacterStates.Dying] = [];
            transitions[CharacterStates.Jumping] = [CharacterStates.Dying];
            transitions[CharacterStates.Falling] = [CharacterStates.Dying];

            var sprinting = StateMachineUtils.getDummyState(CharacterStates.Sprinting);
            var shooting = StateMachineUtils.getDummyState(CharacterStates.Shooting);
            var dying = StateMachineUtils.getDummyState(CharacterStates.Dying);

            var idleEntry = (previous: number, hero: Character): void => {
                hero.animation.stop();
            }

            var idle = new State(CharacterStates.Idle, idleEntry, StateMachineUtils.dummyEventHandler, StateMachineUtils.dummyPredicate);
            var walking = StateMachineUtils.getWalkingState();
            var jumping = StateMachineUtils.getJumpingState();
            var falling = StateMachineUtils.getFallingState();
            
            var states = [idle, sprinting, shooting, dying, jumping, falling, walking].sort((x, y) => x.index - y.index);

            return new StateMachine(states, transitions, character);

        }

        public static translateState(index: number): string {
            return CharacterStates[index] || "No such state!";
        }
    }
}