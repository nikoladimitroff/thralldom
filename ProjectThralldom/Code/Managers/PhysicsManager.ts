/// <reference path="../../scripts/typings/ammo.d.ts" />
module Thralldom {
    export class PhysicsManager {
        
        public world: Ammo.btDiscreteDynamicsWorld;

        public static attachDebuggingVisuals: boolean;
        public static gravityAcceleration: number;
        public static linearDamping: number;
        public static angularDamping: number;

        constructor() {
            var collisionConfiguration= new Ammo.btDefaultCollisionConfiguration();
            var dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
            var overlappingPairCache = new Ammo.btDbvtBroadphase();
            var solver = new Ammo.btSequentialImpulseConstraintSolver();
            this.world = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
            this.world.setGravity(new Ammo.btVector3(0, PhysicsManager.gravityAcceleration, 0));
        }

        public static computeRigidBodyFromMesh(mesh: THREE.Mesh, mass: number): Ammo.btRigidBody {
            mesh.geometry.computeBoundingBox();
            var box = mesh.geometry.boundingBox;
            var halfExtents = new THREE.Vector3();
            halfExtents.subVectors(box.max, box.min).multiplyScalar(mesh.scale.x / 2);
            var shape: Ammo.btCollisionShape;
            var localInertia: Ammo.btVector3;
            var centerToMesh: THREE.Vector3;
            if (mass != 0) {
                // Use a sphere for dynamic objects
                var radius = Math.max(halfExtents.x, halfExtents.z);
                var height = 2 * halfExtents.y  - 2 * radius;
                shape = new Ammo.btCapsuleShape(radius, height);
                centerToMesh = new THREE.Vector3(0, -(radius + height / 2), 0);
            }
            else {

                localInertia = new Ammo.btVector3(0, 0, 0);

                shape = new Ammo.btBoxShape(new Ammo.btVector3(halfExtents.x, halfExtents.y, halfExtents.z));
                centerToMesh = new THREE.Vector3(0, -halfExtents.y, 0);
            }
            var pos = mesh.position;
            var quat = mesh.quaternion;

            var startTransform = new Ammo.btTransform();
            startTransform.setIdentity();
            startTransform.setOrigin(new Ammo.btVector3(pos.x, pos.y + halfExtents.y, pos.z)); // Set initial position
            startTransform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
            var motionState = new Ammo.btDefaultMotionState(startTransform);
            var rigidBodyInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
            //rigidBodyInfo.set_m_friction(0);

            var rigidBody = new Ammo.btRigidBody(rigidBodyInfo);
            rigidBody.setAngularFactor(new Ammo.btVector3(0, 1, 0));
            rigidBody.centerToMesh = centerToMesh;

            rigidBody.setRestitution(0);
            rigidBody.setFriction(0);

            if (mass != 0) {
                rigidBody.setFlags(rigidBody.getFlags() | Ammo.CollisionFlags.CF_KINEMATIC_OBJECT);
                rigidBody.setActivationState(Ammo.ActivationConstants.DISABLE_DEACTIVATION);
                rigidBody.setDamping(PhysicsManager.linearDamping, PhysicsManager.angularDamping);
            }
            
            if (PhysicsManager.attachDebuggingVisuals) {

                setTimeout(function () {
                    halfExtents.divideScalar(mesh.scale.x);
                    var drawableMesh: THREE.Mesh;
                    if (mass != 0) {
                        var radius = Math.max(halfExtents.x, halfExtents.z);
                        var sphereGeom = new THREE.SphereGeometry(radius);
                        drawableMesh = new THREE.Mesh(sphereGeom, new THREE.MeshLambertMaterial({ wireframe: true }));
                        drawableMesh.scale.y = halfExtents.y / radius;
                    }
                    else {
                        // Multiply by two to get the full width/height/depth
                        halfExtents.multiplyScalar(2);
                        var cube = new THREE.CubeGeometry(halfExtents.x, halfExtents.y, halfExtents.z);
                        drawableMesh = new THREE.Mesh(cube, new THREE.MeshLambertMaterial({ wireframe: true }));
                        halfExtents.divideScalar(2);
                    }
                    drawableMesh.position.set(0, 0, 0);

                    drawableMesh.position.y = halfExtents.y;
                    drawableMesh.quaternion.set(0, 0, 0, 1);
                    mesh.add(drawableMesh);

                }, 1000);
            }
            

            return rigidBody;
        }
    }
}