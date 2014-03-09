module Thralldom {
    export class Terrain extends LoadableObject {

        public mesh: THREE.Mesh;
        public rigidBody: CANNON.RigidBody;
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

            var terrain = <THREE.Mesh> content.getContent(ContentLibrary.Models.bore.objectTerrainJS);

            this.mesh = terrain;
            var scale = 1000;
            terrain.scale.set(scale, scale, scale);

            //var compound = new CANNON.Compound();
            //var vertices = terrain.geometry.vertices;
            //for (var i = 0; i < terrain.geometry.faces.length; i++) {
            //    var face = <any> terrain.geometry.faces[i];

            //    var v1 = vertices[<number>face.a],
            //        v2 = vertices[<number>face.b],
            //        v3 = vertices[<number>face.c];

            //    var halfExtents = new CANNON.Vec3();
            //    halfExtents.x = Math.abs((v1.x - v2.x) / 2) //* terrain.scale.x;
            //    halfExtents.z = Math.abs((v1.z - v2.z) / 2) //* terrain.scale.x;
            //    halfExtents.y = 0.5;

            //    var box = new CANNON.Box(halfExtents);
            //    var pos = new CANNON.Vec3();
            //    pos.vadd(v1, pos);
            //    pos.vadd(v2, pos);
            //    pos.vadd(v3, pos);
            //    pos.x /= 3;
            //    pos.y /= 3;
            //    pos.z /= 3;

            //    compound.addChild(box, pos, new CANNON.Quaternion);
            //}

            var planeShape = new CANNON.Plane();
            this.rigidBody = new CANNON.RigidBody(0, planeShape, PhysicsManager.material);
            this.rigidBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        }
    }
} 