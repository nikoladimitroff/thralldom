module Thralldom {
    export class World {
        private static _instance: World;
        public static get instance(): World {
            return World._instance;
        }

        public dynamics: Array<DynamicObject>;
        public statics: Array<LoadableObject>;

        public renderScene: THREE.Scene;

        public physicsWorker: Worker;
        private worldBuffer: ArrayBuffer;
        private worldView: Float32Array;
        private pendingRaycasts: Map<number, IRaycastResult>;

        // TODO: Probably not the best solution, but does the job for O(n)
        public threeIndexToObject: Map<number, DynamicObject>;

        public aiManager: AIManager;

        constructor() {
            this.renderScene = new THREE.Scene();
            this.dynamics = new Array<DynamicObject>();
            this.statics = new Array<LoadableObject>();

            this.physicsWorker = new Worker("Code/Physics/Worker.js");
            this.physicsWorker.onmessage = (eventData) => {
                var data = eventData.data;
                switch (data.code) {
                    case MessageCode.Raycast:
                        this.raycastCompleted(data);
                        break;

                    case MessageCode.AirborneObject:
                        this.objectAirborneChange(data.id, data.isAirborne);
                        break;

                    case MessageCode.UpdateWorld:
                        this.updateDynamicPositions(data);
                        break;

                    default:
                        throw new RangeError("invalid message code: " + data.code);
                };
            }
            this.physicsWorker.onerror = <any>function (e) {
                console.log(arguments);
            }

            this.physicsWorker.postMessage("");

            this.pendingRaycasts = <any> {};
            this.worldBuffer = new ArrayBuffer(BODY_COUNT * MEM_PER_BODY);
            this.worldView = new Float32Array(this.worldBuffer)

            this.aiManager = new AIManager();

            this.threeIndexToObject = <any> {};

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
            this.threeIndexToObject[object.mesh.id] = object;
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
            if (this.worldBuffer.byteLength != 0)
                this.physicsWorker.postMessage({ code: MessageCode.UpdateWorld, buffer: this.worldBuffer }, [this.worldBuffer]);

            for (var i = 0; i < this.dynamics.length; i++) {
                this.dynamics[i].update(delta);
            }

            this.aiManager.update(delta, this);
        }

        public updateDynamicPositions(data: any): void {
            this.worldBuffer = data.buffer;
            this.worldView = new Float32Array(this.worldBuffer);

            var dynamicObjectsCount = Object.keys(this.threeIndexToObject).length;
            for (var i = 0; i < dynamicObjectsCount; i ++) {

                var offset = i * NUMBERS_PER_BODY;
                var object: DynamicObject = this.threeIndexToObject[this.worldView[offset]];
                object.mesh.position.x = this.worldView[offset + 1];
                object.mesh.position.y = this.worldView[offset + 2];
                object.mesh.position.z = this.worldView[offset + 3];
                object.mesh.position.add(object.centerToMesh);

                // WARNING: DONT SET THE QUATERNION FROM THE SIM
                //this.dynamics[i].mesh.quaternion.set(quat.x(), quat.y(), quat.z(), quat.w());
            }
        }

        public requestRaycast(from: THREE.Vector3, to: THREE.Vector3): number {
            var uid = ~~(Math.random() * Number.MAX_VALUE);

            this.physicsWorker.postMessage({
                code: MessageCode.Raycast,
                from: new VectorDTO(from.x, from.y, from.z),
                to: new VectorDTO(to.x, to.y, to.z),
                uid: uid,
            });
            return uid;
        }

        public tryResolveRaycast(promiseUid: number): IRaycastResult {
            var result = this.pendingRaycasts[promiseUid];
            delete this.pendingRaycasts[promiseUid];
            return result;
        }

        public raycastCompleted(data: any): void {
            this.pendingRaycasts[data.uid] = data.result;
        }

        public objectAirborneChange(id: number, isAirborne: boolean): void {
            this.threeIndexToObject[id].isAirborne = isAirborne;
        }

        public computePhysicsBody(id: number, info: IWorkerMeshInfo, bodyType: BodyType): void {
            this.physicsWorker.postMessage({
                code: MessageCode.CreateBody,
                id: id,
                bodyType: bodyType,
                info: info,
            });
        }

        public updatePhysicsSettings(settings: IPhysicsSettings): void {
            this.physicsWorker.postMessage({
                code: MessageCode.UpdateSettings,
                settings: settings,
            });
        }

        public applyImpulse(id: number, impulse: THREE.Vector3): void {
            this.physicsWorker.postMessage({
                code: MessageCode.ApplyImpulse,
                id: id,
                impulse: impulse,
            });
        }

        public setWalkingVelocity(id: number, velocity: THREE.Vector3): void {
            this.physicsWorker.postMessage({
                code: MessageCode.SetWalkingVelocity,
                id: id,
                velocity: velocity,
            });
        }
    }
} 

