module Thralldom {
    export class Spawner {
        public maxUnits: number;
        public character: Character;

        constructor(character: Character, maxUnits: number) {
            this.character = character;
            this.maxUnits = maxUnits;
        }
    }
}