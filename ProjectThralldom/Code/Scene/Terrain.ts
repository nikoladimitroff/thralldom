/// <reference path="../../scripts/typings/ammo.d.ts" />
module Thralldom {
    export class Terrain extends LoadableObject {

        public mesh: THREE.Mesh;
        public rigidBody: Ammo.btRigidBody;
        public id = "terrain";
        public tags: Array<string> = [];

        public loadFromDescription(description: any, content: ContentManager): void {
            if (!description.texture) {
                throw new Error("Terrain needs a texture!");
            }

            super.loadFromDescription(description, content);

            var texture = <THREE.Texture>content.getContent(description.texture);
            if (description.repeatTexture) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(2, 2);
            }

            var size = description.size || 2000;
            var planeGeometry = new THREE.PlaneGeometry(size, size);
            var planeMaterial = new THREE.MeshPhongMaterial({ map: texture });
            var plane = new THREE.Mesh(planeGeometry, planeMaterial);
            plane.rotation.x = -Math.PI / 2;
            plane.receiveShadow = true;

            this.mesh = plane;

            //var groundShape = new Ammo.btBoxShape(new Ammo.btVector3(25, 1, 25)); // Create block 50x2x50
            var groundShape = new Ammo.btStaticPlaneShape(new Ammo.btVector3(0, 1, 0), 0);
            var groundTransform = new Ammo.btTransform();
            groundTransform.setIdentity();
            groundTransform.setOrigin(new Ammo.btVector3(0, 0, 0)); // Set initial position

            var groundMass = 0; // Mass of 0 means ground won't move from gravity or collisions
            var localInertia = new Ammo.btVector3(0, 0, 0);
            var motionState = new Ammo.btDefaultMotionState(groundTransform);
            //var rbInfo = new Ammo.btRigidBodyConstructionInfo(groundMass, motionState, groundShape, localInertia);
            //this.rigidBody = new Ammo.btRigidBody(rbInfo);


            var mesh = <THREE.Mesh>content.getContent(ContentLibrary.Models.bore.objectTerrainJS);
            var scale = 2000;
            mesh.scale.set(scale, scale, scale);
            var vertices: Array<Ammo.btVector3> = GeometryUtils.convertThreeToAmmoGeometry(mesh);

            var meshInterface = new Ammo.btTriangleMesh();
            for (var i = 0; i < mesh.geometry.faces.length; i++) {
                // Mulptiply by 3 because we are iterating faces, not vertices
                var index = 3 * i;
                var face = <THREE.Face3>mesh.geometry.faces[i];
                meshInterface.addTriangle(vertices[face.a], vertices[face.b], vertices[face.c]);
            }

            meshInterface.setScaling(new Ammo.btVector3(mesh.scale.x, mesh.scale.y, mesh.scale.z));
            this.mesh = mesh;
            var shape = new Ammo.btBvhTriangleMeshShape(meshInterface, true);
            var rigidBodyInfo = new Ammo.btRigidBodyConstructionInfo(0, motionState, shape, localInertia);
            this.rigidBody = new Ammo.btRigidBody(rigidBodyInfo);

        }
    }
} 