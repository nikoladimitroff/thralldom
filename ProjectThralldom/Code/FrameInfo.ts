module Thralldom {
    /*
     * Contains information about the events that happened during the last frame. Passed down to every Objective's update function to let them update themselves.
    */
    export class FrameInfo {
        private _hero: Character;
        private _killedEnemies: Array<Character>;

        public get hero(): Character {
            return this._hero;
        }

        public get killedEnemies(): Array<Character> {
            return this._killedEnemies;
        }

        constructor(hero: Character, enemies: Array<Character>) {
            this._hero = hero;
            this._killedEnemies = enemies;
        }
    }
} 