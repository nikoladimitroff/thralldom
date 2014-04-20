module Thralldom {
    export class PhysicsManagerWorker {

        public static defaultSettings: IPhysicsSettings = <any>{};

        public world: Ammo.btDiscreteDynamicsWorld;
        public shapeCache: Map<string, Ammo.btCollisionShape>;
        public settings: IPhysicsSettings;

        public transforms = new Pool<Ammo.btTransform>(<any>Ammo.btTransform);
        public vectors = new Pool<Ammo.btVector3>(<any> Ammo.btVector3);
        public quats = new Pool<Ammo.btQuaternion>(<any> Ammo.btQuaternion);

        constructor() {
            var collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
            var dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
            var overlappingPairCache = new Ammo.btDbvtBroadphase();
            var solver = new Ammo.btSequentialImpulseConstraintSolver();
            this.world = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);

            this.shapeCache = <any> {};
            this.settings = PhysicsManagerWorker.defaultSettings;

            this.world.setGravity(new Ammo.btVector3(0, this.settings.gravity || 0, 0));
        }

        public updateSettings(settings: IPhysicsSettings): void {
            this.settings = settings;
            this.world.setGravity(new Ammo.btVector3(0, this.settings.gravity, 0));
        }

        public raycast(from: IVector3, to: IVector3): Ammo.ClosestRayResultCallback {

            var fromWorld = new Ammo.btVector3();
            var toWorld = new Ammo.btVector3();
            var ray = new Ammo.ClosestRayResultCallback(fromWorld, toWorld);

            fromWorld.setValue(from.x, from.y, from.z);
            toWorld.setValue(to.x, to.y, to.z);

            this.world.rayTest(fromWorld, toWorld, ray);

            return ray;
        }


        private computeInitialMotionState(pos: IVector3, rot: IQuaternion, bias: IVector3 = Const.dtoZeroVector) {

            // Compute transform / motionState

            var initialTransform = new Ammo.btTransform();
            initialTransform.setIdentity();
            // Mesh pos + bias
            var origin = new Ammo.btVector3();
            origin.setValue(pos.x + bias.x, pos.y + bias.y, pos.z + bias.z);
            initialTransform.setOrigin(origin);

            var quat = new Ammo.btQuaternion();
            quat.setValue(rot.x, rot.y, rot.z, rot.w);
            initialTransform.setRotation(quat);
            var motionState = new Ammo.btDefaultMotionState(initialTransform);

            return motionState;
        }

        private computeRigidBodyFromMesh(
            info: IWorkerMeshInfo,
            shapeGenerator: (halfExtents: IVector3) => Ammo.btCollisionShape) {

            // Compute the halfExtents of the bounding box
            var localInertia = Const.btZeroVector;

            var motionState = this.computeInitialMotionState(info.pos, info.rot, info.centerToMesh);

                // Call the shapeGen
            var shape: Ammo.btCollisionShape;
            if (!this.shapeCache[info.shapeUID]) {
                this.shapeCache[info.shapeUID] = shapeGenerator(info.halfExtents);
            }
                
            shape = this.shapeCache[info.shapeUID];
            var rigidBodyInfo = new Ammo.btRigidBodyConstructionInfo(info.mass, motionState, shape, localInertia);

            var rigidBody = new Ammo.btRigidBody(rigidBodyInfo);
            rigidBody.setAngularFactor(Const.btUpVector);
       
            rigidBody.setRestitution(this.settings.restitution);
            rigidBody.setFriction(this.settings.friction);

            // MEMLEAK? Destroy motion state?

            return rigidBody;
        }

        public computeCapsuleBody(mesh: IWorkerMeshInfo): Ammo.btRigidBody {
            var shapeGen = (halfExtents: IVector3) => {
                var radius = Math.max(halfExtents.x, halfExtents.z);
                var height = 2 * halfExtents.y - 2 * radius;
                var shape = new Ammo.btCapsuleShape(radius, height);

                return shape;
            }


            var rigidBody = this.computeRigidBodyFromMesh(mesh, shapeGen);
            //rigidBody.setFlags(rigidBody.getFlags() | Ammo.CollisionFlags.CF_KINEMATIC_OBJECT);
            rigidBody.setActivationState(Ammo.ActivationConstants.DISABLE_DEACTIVATION);
            rigidBody.setDamping(this.settings.linearDamping, this.settings.angularDamping);

            return rigidBody;

        }

        public computeStaticBoxBody(mesh: IWorkerMeshInfo): Ammo.btRigidBody {
            var shapeGen = (halfExtents: IVector3) => {
                var shape = new Ammo.btBoxShape(new Ammo.btVector3(halfExtents.x, halfExtents.y, halfExtents.z));

                return shape;
            }

            var rigidBody = this.computeRigidBodyFromMesh(mesh, shapeGen);
            return rigidBody;
        }

        public computeTriangleMeshBody(mesh: IWorkerMeshInfo): Ammo.btRigidBody {
            var motionState = this.computeInitialMotionState(mesh.pos, mesh.rot);
            var localInertia = Const.btZeroVector;

            var shape: Ammo.btBvhTriangleMeshShape;
            var cacheUID = mesh.shapeUID + mesh.scale;
            if (!this.shapeCache[cacheUID]) {
                // Generate a new mesh if it is not found in the cache
                var vertices = mesh.vertices.map((vertex) => new Ammo.btVector3(vertex.x, vertex.y, vertex.z));

                var meshInterface = new Ammo.btTriangleMesh();
                for (var i = 0; i < mesh.faces.length; i++) {
                    var face = mesh.faces[i];
                    meshInterface.addTriangle(vertices[face.a], vertices[face.b], vertices[face.c]);
                }
                meshInterface.setScaling(new Ammo.btVector3(mesh.scale, mesh.scale, mesh.scale));
                this.shapeCache[cacheUID] = new Ammo.btBvhTriangleMeshShape(meshInterface, true);
            }

            shape = this.shapeCache[cacheUID];
            var rigidBodyInfo = new Ammo.btRigidBodyConstructionInfo(mesh.mass, motionState, shape, localInertia);
            return new Ammo.btRigidBody(rigidBodyInfo);
        }

        public computePlaneBody(): Ammo.btRigidBody {
            var groundTransform = new Ammo.btTransform();
            groundTransform.setIdentity();
            groundTransform.setOrigin(Const.btZeroVector); // Set initial position

            var groundMass = 0; // Mass of 0 means ground won't move from gravity or collisions
            var localInertia = Const.btZeroVector;
            var motionState = new Ammo.btDefaultMotionState(groundTransform);

            var groundShape = new Ammo.btStaticPlaneShape(Const.btUpVector, 0);
            var rbInfo = new Ammo.btRigidBodyConstructionInfo(groundMass, motionState, groundShape, localInertia);
            var rigid = new Ammo.btRigidBody(rbInfo);

            // MEMLEAK? DESTROY SHAPE, MOTION?
            return rigid;
        }
    }
} 