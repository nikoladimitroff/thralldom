module Thralldom {
    export class PhysicsManager {

        private physicsWorker: Worker;

        private worldBuffer: ArrayBuffer;
        private worldView: Float32Array;
        private pendingRaycasts: INumberIndexable<IRaycastResult>;

        // TODO: Probably not the best solution, but does the job for O(n)
        public threeIndexToObject: INumberIndexable<DynamicObject>;

        private static _instance: PhysicsManager;
        public static get instance(): PhysicsManager {
            return PhysicsManager._instance;
        }

        constructor() {
            this.pendingRaycasts = <any> {};
            this.worldBuffer = new ArrayBuffer(BODY_COUNT * MEM_PER_BODY);
            this.worldView = new Float32Array(this.worldBuffer);

            this.threeIndexToObject = <any> {};

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

            var worker: any = this.physicsWorker;
            worker.postMessage();

            PhysicsManager._instance = this;
        }

        public update(delta: number): void {
            if (this.worldBuffer.byteLength != 0)
                this.physicsWorker.postMessage({ code: MessageCode.UpdateWorld, buffer: this.worldBuffer }, [this.worldBuffer]);
        }


        public updateDynamicPositions(data: any): void {
            this.worldBuffer = data.buffer;
            this.worldView = new Float32Array(this.worldBuffer);

            var dynamicObjectsCount = Object.keys(this.threeIndexToObject).length;
            for (var i = 0; i < dynamicObjectsCount; i++) {

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

        public computePhysicsBody(gameObject: IDrawable, info: IWorkerMeshInfo, bodyType: BodyType): void {
            this.physicsWorker.postMessage({
                code: MessageCode.CreateBody,
                id: gameObject.mesh.id,
                bodyType: bodyType,
                info: info,
            });
            if (info.mass != 0) {
                this.threeIndexToObject[gameObject.mesh.id] = <DynamicObject> gameObject;
            }
        }

        public updatePhysicsSettings(settings: IPhysicsSettings): void {
            this.physicsWorker.postMessage({
                code: MessageCode.UpdateSettings,
                settings: settings,
            });
        }

        public applyImpulse(id: number, impulse: THREE.Vector3): void {
            this.physicsWorker.postMessage({
                code: MessageCode.Jump,
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