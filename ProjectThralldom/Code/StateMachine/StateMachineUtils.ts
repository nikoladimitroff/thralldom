module Thralldom {
    export class StateMachineUtils {

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

            var walkingInterupt = (hero: Character) => hero.animation.currentTime != walking.data.lastTime;

            walking = new State(CharacterStates.Walking, walkingEntry, walkingExit, walkingInterupt);

            return walking;
        }

        private static getJumpingState(character: Character): State {
            var jumping: State;

            var jumpingEntry = (previous: number, object: DynamicObject) => {
                jumping.data.canJump = false;
                object.rigidBody.velocity.y = Character.CharacterJumpVelocity;
            }
            
            // Shamelesly stole the following event handler from cannonjs examples
            var contactNormal = new CANNON.Vec3(); // Normal in the contact, pointing *out* of whatever the player touched
            var upAxis = new CANNON.Vec3(0, 1, 0);
            character.rigidBody.addEventListener("collide", function (e) {
                var contact = e.contact;

                // contact.bi and contact.bj are the colliding bodies, and contact.ni is the collision normal.
                // We do not yet know which one is which! Let's check.
                if (contact.bi.id == character.rigidBody.id)  // bi is the player body, flip the contact normal
                    contact.ni.negate(contactNormal);
                else
                    contact.ni.copy(contactNormal); // bi is something else. Keep the normal as it is

                // If contactNormal.dot(upAxis) is between 0 and 1, we know that the contact normal is somewhat in the up direction.
                if (contactNormal.dot(upAxis) > 0.5) // Use a "good" threshold value between 0 and 1 here!
                    jumping.data.canJump = true;
            });

            var jumpingInterupt = (object: DynamicObject): boolean => jumping.data.canJump;

            jumping = new State(CharacterStates.Jumping, jumpingEntry, StateMachineUtils.dummyEventHandler, jumpingInterupt);

            return jumping;

        }

        public static getCharacterStateMachine(character: Character): StateMachine {
            var transitions = new Array<Array<number>>();
            transitions[CharacterStates.Idle] = [CharacterStates.Dying, CharacterStates.Jumping, CharacterStates.Shooting, CharacterStates.Sprinting, CharacterStates.Walking];
            transitions[CharacterStates.Walking] = [CharacterStates.Dying, CharacterStates.Walking, CharacterStates.Jumping, CharacterStates.Shooting, CharacterStates.Sprinting];
            transitions[CharacterStates.Sprinting] = [CharacterStates.Dying, CharacterStates.Idle, CharacterStates.Jumping, CharacterStates.Walking];
            transitions[CharacterStates.Shooting] = [CharacterStates.Dying, CharacterStates.Idle];
            transitions[CharacterStates.Dying] = [];
            transitions[CharacterStates.Jumping] = [CharacterStates.Dying];

            var sprinting = StateMachineUtils.getDummyState(CharacterStates.Sprinting);
            var shooting = StateMachineUtils.getDummyState(CharacterStates.Shooting);
            var dying = StateMachineUtils.getDummyState(CharacterStates.Dying);



            var idleEntry = (previous: number, hero: Character): void => {
                hero.animation.stop();
            }

            var idle = new State(CharacterStates.Idle, idleEntry, StateMachineUtils.dummyEventHandler, StateMachineUtils.dummyPredicate);
            var walking = StateMachineUtils.getWalkingState();
            var jumping = StateMachineUtils.getJumpingState(character);
            
            var states = [idle, sprinting, shooting, dying, jumping, walking].sort((x, y) => x.index - y.index);

            return new StateMachine(states, transitions, character);

        }
    }
}