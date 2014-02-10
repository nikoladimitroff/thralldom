module Thralldom {
    export class Scene {

        public name: string;
        public dynamics: Array<DynamicObject>;
        public statics: Array<ISelectableObject>;
        public renderScene: THREE.Scene;

        constructor() {
            this.renderScene = new THREE.Scene();
            this.dynamics = new Array<DynamicObject>();
            this.statics = new Array<ISelectableObject>();
        }

        /*
         * Selects some of the objects in the scene. Use '.' to select dynamics, '~' to select statics and '#' to select tags
        */
        public select(selector: string): Array<ISelectableObject>  {
            var first = selector.charAt(0);
            var text = selector.substr(1);

            switch (first) {
                case '#': 
                    for (var i = 0; i < this.dynamics.length; i++) {
                        if (this.dynamics[i].id == text) {
                            return [this.dynamics[i]];
                        }
                    }
                    return null;

                case '~':
                    for (var i = 0; i < this.statics.length; i++) {
                        if (this.statics[i].id == text) {
                            return [this.statics[i]];
                        }
                    }

                    return null;
                case '.':
                    var result = [];
                    for (var i = 0; i < this.statics.length; i++) {
                        if (this.statics[i].tags.indexOf(text) != -1) {
                            result.push(this.statics[i]);
                        }
                    }
                    for (var i = 0; i < this.dynamics.length; i++) {
                        if (this.dynamics[i].tags.indexOf(text) != -1) {
                            result.push(this.dynamics[i]);
                        }
                    }

                    return result;

                default:

                    throw new Error("Invalid selector!");
            };
        }

        /*
         * Returns the number of objects that the specified selector matches
        */
        public static match(selector: string, objects: Array<ISelectableObject>): number {
            var count = 0;

            var first = selector.charAt(0);
            var text = selector.substr(1);

            switch (first) {
                case '#':
                case '~':
                    for (var i = 0; i < objects.length; i++) {
                        if (objects[i].id == text) {
                            count++;
                        }
                    }
                    break;
                case '.':
                    for (var i = 0; i < objects.length; i++) {
                        if (objects[i].tags.indexOf(text) != -1) {
                            count++;
                        }
                    }
                    break;
                default:
                    throw new Error("Invalid selector!");
            };

            return count;
        }

        /*
         * Adds a static object to the scene. Note that this method does NOT check whether the id of the object already exists. May cause problems later.
        */
        public addStatic(object: ISelectableObject): void {
            this.statics.push(object);
            this.renderScene.add(object.mesh);
        }

        /*
         * Adds a dynamic object to the scene. Note that this method does NOT check whether the id of the object already exists. May cause problems later.
        */
        public addDynamic(object: DynamicObject): void {
            this.dynamics.push(object);
            this.renderScene.add(object.mesh);
        }

        public remove(object: ISelectableObject): void {
            for (var i = 0; i < this.dynamics.length; i++) {
                if (this.dynamics[i] == object) {
                    // Replace the i-th element with the last instead of splicing.
                    this.renderScene.remove(this.dynamics[i].mesh);
                    this.dynamics[i] = this.dynamics[this.dynamics.length - 1];
                    break;
                }
            }
            this.dynamics.pop();
        }

        public update(delta: number): void {
            for (var i = 0; i < this.dynamics.length; i++) {
                this.dynamics[i].update(delta);
            }
        }
    }
} 