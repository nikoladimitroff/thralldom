module Thralldom {
    export class Scene {

        public name: string;
        public dynamics: Array<DynamicObject>;
        public statics: Array<ISelectableObject>;
        public neutral: Array<ISelectableObject>;

        public renderScene: THREE.Scene;


        private physicsSim: PhysicsManager;

        constructor() {
            this.renderScene = new THREE.Scene();
            this.dynamics = new Array<DynamicObject>();
            this.statics = new Array<ISelectableObject>();
            this.neutral = new Array<ISelectableObject>();

            this.physicsSim = new PhysicsManager();
        }


        /*
         * Selects some of the objects in the scene. Use '.' to select tags, '~' to select statics and '#' to select dynanamics
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
        public addStatic(object: any): void {
            this.statics.push(object);
            //if (!(object instanceof Terrain))
                this.renderScene.add(object.mesh);
            this.physicsSim.world.add(object.rigidBody);
            object.rigidBody.tag = object.tags[0];
        }

        /*
         * Adds a dynamic object to the scene. Note that this method does NOT check whether the id of the object already exists. May cause problems later.
        */
        public addDynamic(object: any): void {
            this.dynamics.push(object);
            this.renderScene.add(object.mesh);
            this.physicsSim.world.add(object.rigidBody);
            object.rigidBody.tag = object.tags[0];
            var rigid = <CANNON.RigidBody> object.rigidBody;
       }

        public addNeutral(object: ISelectableObject): void {
            this.renderScene.add(object.mesh);
        }

        private tryRemove(object: ISelectableObject, collection: Array<ISelectableObject>): boolean {
            var found = false;
            for (var i = 0; i < collection.length; i++) {
                if (collection[i] == object) {
                    this.renderScene.remove(collection[i].mesh);
                    // Replace the i-th element with the last instead of splicing.
                    collection[i] = collection[collection.length - 1];
                    found = true;
                    break;
                }
            }
            if (found)
                collection.pop();

            return found;
        }

        public remove(object: ISelectableObject): boolean {
            return this.tryRemove(object, this.dynamics) ||
                this.tryRemove(object, this.statics) ||
                this.tryRemove(object, this.neutral);    
        }

        public update(delta: number): void {
            for (var i = 0; i < this.dynamics.length; i++) {
                this.dynamics[i].update(delta);

                //var pos: CANNON.Vector = this.dynamics[i].mesh.position;
                //var quat: CANNON.Quaternion = this.dynamics[i].mesh.quaternion;

                //this.dynamics[i].rigidBody.position.set(pos.x, pos.y, pos.z);
                //this.dynamics[i].rigidBody.quaternion.set(quat.x, quat.y, quat.z, quat.w);
            }


            this.physicsSim.world.step(delta);
            for (var i = 0; i < this.dynamics.length; i++) {
                var pos = this.dynamics[i].rigidBody.position;
                var centerToMesh = this.dynamics[i].rigidBody.centerToMesh;
                var quat = this.dynamics[i].rigidBody.quaternion;
                //pos.y = 0;
                this.dynamics[i].mesh.position.set(pos.x + centerToMesh.x, pos.y + centerToMesh.y, pos.z + centerToMesh.z);
                this.dynamics[i].mesh.quaternion.set(quat.x, quat.y, quat.z, quat.w);
            }


        }
    }
} 