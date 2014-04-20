// Worker thread
importScripts("../../Scripts/implementations/ammo.small.js");
importScripts("SharedInterfaces.js");
importScripts("../Constants.js");
importScripts("../Pool.js");
importScripts("PhysicsManagerWorker.js");

/* UNSOLVED MYSTERIES
    The application doesn't work with this code
    How do I know the body count
    Shouldn't this totally random code be extracted into a class?
    When updating the world, can we save additional 4 bytes per body by not including its index? Can we use the index in the array? Otherwise, we'd have to loop
        all three.js objects to find the one that matches the id or maybe?
*/

module Thralldom {
    export class PhysicsWorker {
        private static FallingEntranceMultiplier = 0.4;

        public physManager: Thralldom.PhysicsManagerWorker;

        public worldBuffer: ArrayBuffer;
        public worldView: Float32Array;
        public meshToBody: Map<number, Ammo.btRigidBody>;
        public bodyToMesh: Map<number, number>;

        constructor() {
            this.physManager = new Thralldom.PhysicsManagerWorker();

            this.meshToBody = <any> {};
            this.bodyToMesh = <any> {};

        }

        public updateWorldAndBuffer(): void {
            var transform = new Ammo.btTransform(),
                pos: Ammo.btVector3,
                quat: Ammo.btQuaternion;

            var objects = Object.keys(this.meshToBody);
            var dynamicObjectsCounter = 0;
            for (var i = 0; i < objects.length; i++) {
                var body = this.meshToBody[objects[i]];
                if (!body.needsUpdate) {
                    continue;
                }
                body.getMotionState().getWorldTransform(transform);
                //this.dynamics[i].rigidBody.applyDamping();

                pos = transform.getOrigin();
                quat = transform.getRotation();

                var offset = dynamicObjectsCounter++ * NUMBERS_PER_BODY;
                var threeIndex: number = this.bodyToMesh[body.a || body.ptr];
                this.worldView[offset] = threeIndex;
                this.worldView[offset + 1] = pos.x();
                this.worldView[offset + 2] = pos.y();
                this.worldView[offset + 3] = pos.z();

                // Do stuff with airbornes
                if (body.isAirborne) {
                    var from: Ammo.btVector3 = pos,
                        to: Ammo.btVector3 = new Ammo.btVector3();

                    to.setValue(from.x(), from.y() - body.rayLength, from.z());

                    var callback = new Ammo.ClosestRayResultCallback(from, to);
                    this.physManager.world.rayTest(from, to, callback);
                    if (callback.hasHit()) {
                        // Send a message that the object is no longer airborne
                        (<any>self).postMessage({
                            code: MessageCode.AirborneObject,
                            id: threeIndex,
                            isAirborne: false,
                        });
                        body.isAirborne = false;
                    }
                }
                else {
                    var velocityY = body.getLinearVelocity().y();
                    // Negative velocity bigger than gravity * gravityMultiplier
                    var isAirborne = velocityY < 0 && Math.abs(velocityY) > Math.abs(this.physManager.settings.gravity * PhysicsWorker.FallingEntranceMultiplier);

                    if (isAirborne) {
                        // The object is now flying
                        (<any>self).postMessage({
                            code: MessageCode.AirborneObject,
                            id: threeIndex,
                            isAirborne: true,
                        });
                        body.isAirborne = true;
                    }
                }

                // WARNING: DONT SET THE QUATERNION FROM THE SIM
                //this.dynamics[i].mesh.quaternion.set(quat.x(), quat.y(), quat.z(), quat.w());
            }
        }

        private flag = false;
        private updateWorld(data: any): void {
            this.worldBuffer = data.buffer;
            this.worldView = new Float32Array(this.worldBuffer)

            this.physManager.world.stepSimulation(1 / 60, 5);
            this.updateWorldAndBuffer();
            var messageWorld = {
                code: MessageCode.UpdateWorld,
                buffer: this.worldBuffer,
            };

            (<any>self).postMessage(messageWorld, [this.worldBuffer]);
        }

        private raycast(data: any): void {
            var from = data.from,
                to = data.to;

            var result = this.physManager.raycast(from, to);
            var hasHit = result.hasHit();
            var hitPoint = result.get_m_hitPointWorld();
            var collisionObject = result.get_m_collisionObject();

            var messageRaycast = {
                code: MessageCode.Raycast,
                uid: data.uid,
                result: {
                    hasHit: hasHit,
                    hitPoint: new VectorDTO(hitPoint.x(), hitPoint.y(), hitPoint.z()),
                    collisionObjectId: this.bodyToMesh[collisionObject.a || collisionObject.ptr],
                }
            };

            (<any>self).postMessage(messageRaycast);
        }

        private createBody(data: any): void {
            var id: number = data.id;
            var type: BodyType = data.bodyType;
            var meshInfo: Thralldom.IWorkerMeshInfo = data.info;
            var body: Ammo.btRigidBody = null;
            switch (type) {
                case BodyType.Box:
                    body = this.physManager.computeStaticBoxBody(meshInfo);
                    break;

                case BodyType.Capsule:
                    body = this.physManager.computeCapsuleBody(meshInfo);
                    body.needsUpdate = true;
                    break;

                case BodyType.TriangleMesh:
                    body = this.physManager.computeTriangleMeshBody(meshInfo);
                    break;

                case BodyType.Plane:
                    body = this.physManager.computePlaneBody();
                    break;

                default:
                    throw new Error("invalid body type: " + type);
            };
            body.rayLength = meshInfo.raycastRayLength;
            this.meshToBody[id] = body;
            this.bodyToMesh[body.a || body.ptr] = id;
            this.physManager.world.addRigidBody(body);
        }

        private setWalkingVelocity(data: any): void {
            var id: number = data.id;
            var velocity: Thralldom.IVector3 = data.velocity;

            var body: Ammo.btRigidBody = this.meshToBody[id];
            var velocityVector = body.getLinearVelocity();
            velocityVector.setX(velocity.x);
            velocityVector.setZ(velocity.z);
        }

        private applyImpulse(data: any): void {
            var id = data.id;
            var impulse = data.impulse;
            this.meshToBody[id].applyCentralImpulse(new Ammo.btVector3(impulse.x, impulse.y, impulse.z));
        }

        private updateSettings(data: any): void {
            this.physManager.updateSettings(data.settings);
        }


        public handleMessage(data: any): void {
            var code = data.code;
            var codeName = MessageCode[code];
            var camelCased = codeName[0].toLowerCase() + codeName.substr(1);
            // Call the appropriate function
            this[camelCased](data);
        }
    }
}

function main() {

    var worker = new Thralldom.PhysicsWorker();

    self.onmessage = function (event) {
        var data = event.data;
        if (!data) {
            console.log("Falsy data: ", data);
            return;
        }
        worker.handleMessage(data);
    }
}

main();