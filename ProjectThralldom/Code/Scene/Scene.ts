module Thralldom {
    export class Scene {
        public dynamics: Array<DynamicObject>;
        public statics: Array<LoadableObject>;

        public renderScene: THREE.Scene;


        public physicsSim: PhysicsManager;

        constructor() {
            this.renderScene = new THREE.Scene();
            this.dynamics = new Array<DynamicObject>();
            this.statics = new Array<LoadableObject>();

            this.physicsSim = new PhysicsManager();
        }


        /*
         * Selects some of the objects in the scene. Use '.' to select tags, '~' to select statics and '#' to select dynanamics
        */
        public select(selector: string): Array<LoadableObject>  {
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
        public static match(selector: string, objects: Array<LoadableObject>): number {
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
        public addStatic(object: LoadableObject): void {
            this.statics.push(object);
            this.renderScene.add(object.mesh);


            if (!(object instanceof Skybox))
                this.physicsSim.world.addRigidBody(object.rigidBody);
        }

        /*
         * Adds a dynamic object to the scene. Note that this method does NOT check whether the id of the object already exists. May cause problems later.
        */
        public addDynamic(object: DynamicObject): void {
            this.dynamics.push(object);
            this.renderScene.add(object.mesh);
            this.physicsSim.world.addRigidBody(object.rigidBody);
       }

        public addDrawable(object: IDrawable): void {
            this.renderScene.add(object.mesh);
        }

        private tryRemove(object: ISelectableObject, collection: Array<LoadableObject>): boolean {
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

        public remove(object: ISelectableObject): boolean;
        public remove(object: IDrawable): boolean;

        public remove(object: any): boolean {
            if (object.id)
                return this.tryRemove(object, this.dynamics) ||
                       this.tryRemove(object, this.statics);
            else if (object.mesh) {
                this.renderScene.remove(object.mesh);
            }
            else {
                throw new Error("invalid");
            }
        }
        public update(delta: number): void {
            for (var i = 0; i < this.dynamics.length; i++) {
                this.dynamics[i].update(delta);
            }

            var transform = new Ammo.btTransform(),
                pos: Ammo.btVector3,
                quat: Ammo.btQuaternion;

            this.physicsSim.world.stepSimulation(1 / 60, 5);

            for (var i = 0; i < this.dynamics.length; i++) {
                this.dynamics[i].rigidBody.getMotionState().getWorldTransform(transform);
                //this.dynamics[i].rigidBody.applyDamping();

                pos = transform.getOrigin();
                quat = transform.getRotation();
                var centerToMesh = this.dynamics[i].rigidBody.centerToMesh;

                this.dynamics[i].mesh.position.set(pos.x() + centerToMesh.x, pos.y() + centerToMesh.y, pos.z() + centerToMesh.z);
                // WARNING: DONT SET THE QUATERNION FROM THE SIM
                //this.dynamics[i].mesh.quaternion.set(quat.x(), quat.y(), quat.z(), quat.w());
            }

            // MEMLEAK
            Ammo.destroy(transform);


        }
    }
} 