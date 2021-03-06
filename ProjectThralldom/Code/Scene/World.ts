module Thralldom {
    export class World {
        private static _instance: World;
        public static get instance(): World {
            return World._instance;
        }

        public dynamics: Array<DynamicObject>;
        public statics: Array<LoadableObject>;

        public renderScene: THREE.Scene;
        public controllerManager: ControllerManager;

        constructor() {
            this.renderScene = new THREE.Scene();
            this.dynamics = new Array<DynamicObject>();
            this.statics = new Array<LoadableObject>();

            this.controllerManager = new ControllerManager();

            World._instance = this;
        }


        /*
         * Selects some of the objects in the scene. Use '.' to select tags, '~' to select statics and '#' to select dynanamics
        */
        public select(selector: string): Array<LoadableObject> {
            selector = selector.toLowerCase();
            var first = selector.charAt(0);
            var text = selector.substr(1);

            switch (first) {
                case '#': 
                    return [this.selectByDynamicId(text)];
                case '~':
                    return [this.selectByStaticId(text)];
                case '.':
                    return this.selectByTag(text);

                default:
                    throw new Error("Invalid selector!");
            };
        }

        public selectByTag(tagName: string): Array<LoadableObject> {
            var result = [];
            for (var i = 0; i < this.statics.length; i++) {
                if (this.statics[i].tags.indexOf(tagName) != -1) {
                    result.push(this.statics[i]);
                }
            }
            for (var i = 0; i < this.dynamics.length; i++) {
                if (this.dynamics[i].tags.indexOf(tagName) != -1) {
                    result.push(this.dynamics[i]);
                }
            }

            return result;
        }

        public selectByDynamicId(id: string): DynamicObject {
            for (var i = 0; i < this.dynamics.length; i++) {
                if (this.dynamics[i].id == id) {
                    return this.dynamics[i];
                }
            }
            return null;
        }

        public selectByStaticId(id: string): LoadableObject {
            for (var i = 0; i < this.statics.length; i++) {
                if (this.statics[i].id == id) {
                    return this.statics[i];
                }
            }

            return null;
        }

        public selectByPhysId(id: number): LoadableObject {
            var all = this.statics.concat(this.dynamics);
            for (var i = 0; i < all.length; i++) {
                var obj = all[i];
                if (obj.mesh.id == id) {
                    return obj;
                }
            }
            return undefined;
        }

        /*
         * Returns the number of objects that the specified selector matches
        */
        public static countMatches(selector: string, objects: Array<ISelectableObject>): number {
            var count = 0;

            selector = selector.toLowerCase();
            var first = selector.charAt(0);
            var text = selector.substr(1);

            switch (first) {
                case '*':
                    return objects.length;
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

        public static matches(selector: string, object: ISelectableObject): boolean {
            selector = selector.toLowerCase();
            var first = selector.charAt(0);
            var text = selector.substr(1);

            switch (first) {
                case '*':
                    return true;
                case '#':
                case '~':
                    return text == object.id;
                case '.':
                    return object.tags.indexOf(text) != -1;
                default:
                    throw new Error("Invalid selector!");
            };
        }

        /*
         * Adds a static object to the world. Note that this method does NOT check whether the id of the object already exists. May cause problems later.
        */
        public addStatic(object: LoadableObject): void {
            this.statics.push(object);
            this.renderScene.add(object.mesh);
        }

        /*
         * Adds a dynamic object to the world. Note that this method does NOT check whether the id of the object already exists. May cause problems later.
        */
        public addDynamic(object: DynamicObject): void {
            this.dynamics.push(object);
            this.renderScene.add(object.mesh);
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

            this.controllerManager.update(delta, this);
        }

        private mergeMaterials(tag: string): THREE.MeshFaceMaterial {
            var megamaterial = new THREE.MeshFaceMaterial();

            for (var i = 0; i < this.statics.length; i++) {
                if (this.statics[i] instanceof Terrain)
                    continue;
                if (this.statics[i] instanceof Skybox)
                    continue;

                if (tag.length != 0 && this.statics[i].tags.indexOf(tag) == -1)
                    continue;

                var current = this.statics[i].mesh;
                if (current.material instanceof THREE.MeshFaceMaterial) {
                    megamaterial.materials = megamaterial.materials.concat((<THREE.MeshFaceMaterial>current.material).materials);
                }
                else {
                    megamaterial.materials.push(current.material);
                }
            }

            var mats = megamaterial.materials;
            megamaterial.materials = megamaterial.materials.filter((mat, index, arr) => arr.indexOf(mat) == index);
            return megamaterial;
        }

        public mergeStatics(): void {
            var opaqueGeometry = new THREE.Geometry(),
                transparentGeometry = new THREE.Geometry();
            
            // Combine all materials into one
            var opaqueMaterial = this.mergeMaterials(""),
                transparentMaterial = this.mergeMaterials("transparent");
            transparentMaterial.transparent = true;

            var processedGeometries: any = {};
            for (var i = 0; i < this.statics.length; i++) {
                var current = this.statics[i].mesh;
                if (this.statics[i] instanceof Thralldom.Terrain) continue;
                if (this.statics[i] instanceof Thralldom.Skybox) continue;

                if (!processedGeometries[current.name]) {
                    var faces = current.geometry.faces;
                    for (var j = 0; j < faces.length; j++) {
                        // Set all materials to 0, works due to all static geometry using a single material
                        // If that was not the case, set the mat index to megamaterial.materials.indexOf(current.material);
                        faces[j].materialIndex = 0;
                    }
                    processedGeometries[current.name] = true;
                }

                current.updateMatrix();
                if (this.statics[i].tags.indexOf("transparent") != -1) {
                    transparentGeometry.merge(current.geometry, current.matrix, 0);
                }
                else {
                    opaqueGeometry.merge(current.geometry, current.matrix, 0);
                }

                this.renderScene.remove(current);
            }
            // Since Borko is a nice guy, all static geometry uses a single material, we don't need the megamaterial
            var opaqueMesh = new THREE.Mesh(opaqueGeometry, opaqueMaterial);
            opaqueMesh.name = "OpaqueScenery";
            var transparentMesh = new THREE.Mesh(transparentGeometry, transparentMaterial);
            transparentMesh.name = "TransparentScenery";
            this.renderScene.add(opaqueMesh);
            this.renderScene.add(transparentMesh);
        }
    }
} 

