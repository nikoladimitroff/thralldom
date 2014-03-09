module Thralldom {
    export class PhysicsManager {
        
        public world: CANNON.World;


        public static material: CANNON.Material;
        public static contactMaterial: CANNON.ContactMaterial;
        public static gravityAcceleration: number;
        public static attachDebuggingVisuals: boolean;
        public static linearDamping: number;

        constructor() {
            this.world = new CANNON.World();
            this.world.gravity.set(0, PhysicsManager.gravityAcceleration, 0);
            this.world.broadphase = new CANNON.NaiveBroadphase();

            this.world.quatNormalizeSkip = 0;
            this.world.quatNormalizeFast = false;

            var solver = new CANNON.GSSolver

            solver.iterations = 10;
            solver.tolerance = 0.1;
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
            var shape: CANNON.Shape;
            if (mass != 0) {
                // Use a sphere for dynamic objects
                shape = new CANNON.Sphere(Math.max(halfExtents.x, halfExtents.y, halfExtents.z));

            }
            else {
                shape = new CANNON.Box(new CANNON.Vec3(halfExtents.x, halfExtents.y, halfExtents.z));
                console.log(halfExtents);
            }
            var rigidBody = new CANNON.RigidBody(mass, shape, PhysicsManager.material);
            rigidBody.linearDamping = PhysicsManager.linearDamping;
            var pos = mesh.position;
            var quat = mesh.quaternion;
            rigidBody.quaternion.set(quat.x, quat.y, quat.z, quat.w);
            rigidBody.position.set(pos.x, pos.y + halfExtents.y, pos.z);
            rigidBody.centerToMesh = new THREE.Vector3(0, -halfExtents.y, 0);


            if (PhysicsManager.attachDebuggingVisuals) {

                setTimeout(function () {
                    halfExtents.divideScalar(mesh.scale.x);
                    var drawableMesh: THREE.Mesh;
                    if (mass != 0) {
                        var sphereGeom = new THREE.SphereGeometry(Math.max(halfExtents.x, halfExtents.y, halfExtents.z));
                        drawableMesh = new THREE.Mesh(sphereGeom, new THREE.MeshLambertMaterial({ wireframe: true }));
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