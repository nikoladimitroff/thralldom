/// <reference path="../../scripts/typings/cannonjs/cannon.d.ts" />


//physicsContactMaterial.contactEquationRegularizationTime = 9999;
module Thralldom {
    export class PhysicsManager {
        
        public world: CANNON.World;


        public static material: CANNON.Material;
        public static contactMaterial: CANNON.ContactMaterial;
        public static gravityAcceleration: number;
        public static attachDebuggingVisuals: boolean;

        constructor() {
            this.world = new CANNON.World();
            this.world.gravity.set(0, PhysicsManager.gravityAcceleration, 0);
            this.world.broadphase = new CANNON.NaiveBroadphase();

            this.world.quatNormalizeSkip = 0;
            this.world.quatNormalizeFast = false;

            var solver = new CANNON.GSSolver

            solver.iterations = 10;
            solver.tolerance = 0;
            var split = true;
            if (split)
                this.world.solver = new CANNON.SplitSolver(solver);
            else
                this.world.solver = solver;


            // We must add the contact materials to the world
            this.world.addContactMaterial(PhysicsManager.contactMaterial);
        }

        public static computeRigidBodyFromMesh(mesh: THREE.Mesh, mass: number): CANNON.RigidBody {
            mesh.geometry.computeBoundingBox();
            var box = mesh.geometry.boundingBox;
            var halfExtents = new THREE.Vector3();
            halfExtents.subVectors(box.max, box.min).multiplyScalar(mesh.scale.x / 2);
            var boxShape = new CANNON.Box(new CANNON.Vec3(halfExtents.x, halfExtents.y, halfExtents.z));
            var rigidBody = new CANNON.RigidBody(mass, boxShape, PhysicsManager.material);
            var pos = mesh.position;
            var quat = mesh.quaternion;
            if (mass != 0) {
                mesh.rotation.x = 0;
                mesh.rotation.y = 0;
                mesh.rotation.z = 0;
                quat = mesh.quaternion;
            }
            rigidBody.quaternion.set(quat.x, quat.y, quat.z, quat.w);
            rigidBody.position.set(pos.x, pos.y + halfExtents.y, pos.z);
            rigidBody.centerToMesh = new THREE.Vector3(0, -halfExtents.y, 0);

            if (PhysicsManager.attachDebuggingVisuals) {

                setTimeout(function () {
                    halfExtents.multiplyScalar(2 / mesh.scale.x);
                    var cube = new THREE.CubeGeometry(halfExtents.x, halfExtents.y, halfExtents.z);
                    var cubeMesh = new THREE.Mesh(cube, new THREE.MeshLambertMaterial({ color: 0xFF0000, transparent: true, opacity: 0.5, wireframe: true }));
                    cubeMesh.position.set(0, 0, 0);

                    cubeMesh.position.y = halfExtents.y / 2;
                    cubeMesh.quaternion.set(0, 0, 0, 1);
                    mesh.add(cubeMesh);

                }, 1000);
            }
            

            return rigidBody;
        }
    }
}