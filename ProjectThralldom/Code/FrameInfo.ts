module Thralldom {
    /*
     * Contains information about the events that happened during the last frame. Passed down to every Objective's update function to let them update themselves.
    */
    export class FrameInfo {
        private _hero: Character;
        private _killedEnemies: Array<Character>;
        private _scene: Thralldom.Scene;

        public get hero(): Character {
            return this._hero;
        }

        public get killedEnemies(): Array<Character> {
            return this._killedEnemies;
        }

        public get scene(): Thralldom.Scene {
            return this._scene;
        }

        constructor(scene: Thralldom.Scene, hero: Character, enemies: Array<Character>) {
            this._scene = scene;
            this._hero = hero;
            this._killedEnemies = enemies;
        }
    }
} 