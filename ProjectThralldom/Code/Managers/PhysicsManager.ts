/// <reference path="../../scripts/typings/ammo.d.ts" />
module Thralldom {
    export class PhysicsManager {
        
        public world: Ammo.btDiscreteDynamicsWorld;

        public static attachDebuggingVisuals: boolean;
        public static defaultSettings: IPhysicsSettings

        private settings: IPhysicsSettings;

        constructor() {
            var collisionConfiguration= new Ammo.btDefaultCollisionConfiguration();
            var dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
            var overlappingPairCache = new Ammo.btDbvtBroadphase();
            var solver = new Ammo.btSequentialImpulseConstraintSolver();
            this.world = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);

            this.settings = PhysicsManager.defaultSettings;

            this.world.setGravity(new Ammo.btVector3(0, this.settings.gravity, 0));
        }

        private static computeInitialMotionState(mesh: THREE.Mesh, bias: THREE.Vector3 = new THREE.Vector3(0, 0, 0)) {

            // Compute transform / motionState
            var pos = mesh.position;
            var quat = mesh.quaternion;

            var initialTransform = new Ammo.btTransform();
            initialTransform.setIdentity();
            // Mesh pos + bias
            initialTransform.setOrigin(new Ammo.btVector3(pos.x + bias.x, pos.y + bias.y, pos.z + bias.z));
            initialTransform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
            var motionState = new Ammo.btDefaultMotionState(initialTransform);

            return motionState;
        }

        private static computeRigidBodyFromMesh(mesh: THREE.Mesh,
            mass: number,
            shapeGenerator: (halfExtents: THREE.Vector3) => { shape: Ammo.btCollisionShape; centerToMesh: THREE.Vector3 },
            debuggingVisualGenerator: (halfExtents: THREE.Vector3) => THREE.Mesh) {

            // Compute the halfExtents of the bounding box
            mesh.geometry.computeBoundingBox();
            var box = mesh.geometry.boundingBox;
            var halfExtents = new THREE.Vector3();
            halfExtents.subVectors(box.max, box.min).multiplyScalar(mesh.scale.x / 2);
            var localInertia = new Ammo.btVector3(0, 0, 0);

            var motionState = PhysicsManager.computeInitialMotionState(mesh, new THREE.Vector3(0, halfExtents.y, 0));

            // Call the shapeGen
            var shapeResult = shapeGenerator(halfExtents);
            var rigidBodyInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shapeResult.shape, localInertia);

            var rigidBody = new Ammo.btRigidBody(rigidBodyInfo);
            rigidBody.setAngularFactor(new Ammo.btVector3(0, 1, 0));
            rigidBody.centerToMesh = shapeResult.centerToMesh;

            rigidBody.setRestitution(PhysicsManager.defaultSettings.restitution);
            rigidBody.setFriction(PhysicsManager.defaultSettings.friction);

            
            if (PhysicsManager.attachDebuggingVisuals) {
                setTimeout(function () {
                    halfExtents.divideScalar(mesh.scale.x);
                    // Call the visual gen
                    var drawableMesh: THREE.Mesh = debuggingVisualGenerator(halfExtents);
                    drawableMesh.position.set(0, 0, 0);
                    // Move the mesh up to align the objects' centres
                    drawableMesh.position.y = halfExtents.y;
                    drawableMesh.quaternion.set(0, 0, 0, 1);
                    mesh.add(drawableMesh);
                }, 1000);
            }           

            return rigidBody;
        }

        public static computeCapsuleBody(mesh: THREE.Mesh, mass: number): Ammo.btRigidBody {

            var shapeGen = (halfExtents: THREE.Vector3) => {
                var radius = Math.max(halfExtents.x, halfExtents.z);
                var height = 2 * halfExtents.y - 2 * radius;
                var shape = new Ammo.btCapsuleShape(radius, height);
                var centerToMesh = new THREE.Vector3(0, -(radius + height / 2), 0);

                return { shape: shape, centerToMesh: centerToMesh };
            }

            var visualGen = (halfExtents: THREE.Vector3): THREE.Mesh => {
                var radius = Math.max(halfExtents.x, halfExtents.z);
                var sphereGeom = new THREE.SphereGeometry(radius);
                var drawableMesh = new THREE.Mesh(sphereGeom, new THREE.MeshLambertMaterial({ wireframe: true }));
                drawableMesh.scale.y = halfExtents.y / radius;

                return drawableMesh;
            };

            var rigidBody = PhysicsManager.computeRigidBodyFromMesh(mesh, mass, shapeGen, visualGen);
            rigidBody.setFlags(rigidBody.getFlags() | Ammo.CollisionFlags.CF_KINEMATIC_OBJECT);
            rigidBody.setActivationState(Ammo.ActivationConstants.DISABLE_DEACTIVATION);
            rigidBody.setDamping(PhysicsManager.defaultSettings.linearDamping, PhysicsManager.defaultSettings.angularDamping);

            return rigidBody;

        } 

        public static computeStaticBoxBody(mesh: THREE.Mesh): Ammo.btRigidBody {
            var shapeGen = (halfExtents: THREE.Vector3) => {
                var shape = new Ammo.btBoxShape(new Ammo.btVector3(halfExtents.x, halfExtents.y, halfExtents.z));
                var centerToMesh = new THREE.Vector3(0, -halfExtents.y, 0);

                return { shape: shape, centerToMesh: centerToMesh };
            }

            var visualGen = (halfExtents: THREE.Vector3) => {
                // Multiply by two to get the full width/height/depth
                var cube = new THREE.CubeGeometry(halfExtents.x * 2, halfExtents.y * 2, halfExtents.z * 2);

                var drawableMesh = new THREE.Mesh(cube, new THREE.MeshLambertMaterial({ wireframe: true }));
                return drawableMesh;
            };

            var rigidBody = PhysicsManager.computeRigidBodyFromMesh(mesh, 0, shapeGen, visualGen);
            return rigidBody;
        }

        public static computeTriangleMeshBody(mesh: THREE.Mesh): Ammo.btRigidBody {
            var motionState = PhysicsManager.computeInitialMotionState(mesh);
            var localInertia = new Ammo.btVector3(0, 0, 0);

            var vertices = mesh.geometry.vertices.map((vertex) => new Ammo.btVector3(vertex.x, vertex.y, vertex.z));

            var meshInterface = new Ammo.btTriangleMesh();
            for (var i = 0; i < mesh.geometry.faces.length; i++) {
                var face = <THREE.Face3>mesh.geometry.faces[i];
                meshInterface.addTriangle(vertices[face.a], vertices[face.b], vertices[face.c]);
            }

            meshInterface.setScaling(new Ammo.btVector3(mesh.scale.x, mesh.scale.y, mesh.scale.z));
            var shape = new Ammo.btBvhTriangleMeshShape(meshInterface, true);
            var rigidBodyInfo = new Ammo.btRigidBodyConstructionInfo(0, motionState, shape, localInertia);
            return new Ammo.btRigidBody(rigidBodyInfo);
        }

        public static computePlaneBody(): Ammo.btRigidBody {
            var groundTransform = new Ammo.btTransform();
            groundTransform.setIdentity();
            groundTransform.setOrigin(new Ammo.btVector3(0, 0, 0)); // Set initial position

            var groundMass = 0; // Mass of 0 means ground won't move from gravity or collisions
            var localInertia = new Ammo.btVector3(0, 0, 0);
            var motionState = new Ammo.btMotionState(groundTransform);

            var groundShape = new Ammo.btStaticPlaneShape(new Ammo.btVector3(0, 1, 0), 0);
            var rbInfo = new Ammo.btRigidBodyConstructionInfo(groundMass, motionState, groundShape, localInertia);
            return new Ammo.btRigidBody(rbInfo);
        }
    }
}