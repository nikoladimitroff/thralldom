module Thralldom {
    export class GeometryUtils {
        public static createCoordinateAxes(scale: number): Array<THREE.Line> {
            scale = scale || 10;
            var axes: Array<THREE.Line> = [];

            var lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
            var lineGeometry = new THREE.Geometry();
            lineGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
            lineGeometry.vertices.push(new THREE.Vector3(scale, 0, 0));
            var Ox = new THREE.Line(lineGeometry, lineMaterial);

            lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
            lineGeometry = new THREE.Geometry();
            lineGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
            lineGeometry.vertices.push(new THREE.Vector3(0, scale, 0));
            var Oy = new THREE.Line(lineGeometry, lineMaterial);

            lineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff,  });
            lineGeometry = new THREE.Geometry();
            lineGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
            lineGeometry.vertices.push(new THREE.Vector3(0, 0, scale));
            var Oz = new THREE.Line(lineGeometry, lineMaterial);

            axes.push(Ox);
            axes.push(Oy);
            axes.push(Oz);

            return axes;
        }

        public static quaternionFromVectors(u: THREE.Vector3, v: THREE.Vector3) {
            var quat = new THREE.Quaternion();
            var a = new THREE.Vector3();
            a.crossVectors(u, v);
            quat.x = a.x;
            quat.y = a.y;
            quat.z = a.z;
            quat.w = Math.sqrt(Math.pow(u.length(), 2) * Math.pow(v.length(), 2)) + u.dot(v);
            quat.normalize();

            return quat;
        }

        public static getQuestMarker(material: THREE.MeshBasicMaterial): THREE.Mesh {
            var geometry = new THREE.TetrahedronGeometry(10);

            geometry.faceVertexUvs[0] = [];     
            for (var i = 0; i < geometry.faces.length; i++) {

                // set new coordinates, all faces will have same mapping.   
                geometry.faceVertexUvs[0].push([
                    new THREE.Vector2(0, 0),
                    new THREE.Vector2(0, 1),
                    new THREE.Vector2(1, 1),

                ]);
                geometry.faces[i].materialIndex = 0;
            }
            geometry.computeFaceNormals();
            geometry.uvsNeedUpdate = true;

            material = new THREE.MeshPhongMaterial({ map: THREE.ImageUtils.loadTexture("Content/Textures/RedChecker.png") });

            var node = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial([material]));
            var head = node.geometry.vertices[0];
            var plane = [node.geometry.vertices[1], node.geometry.vertices[2], node.geometry.vertices[3]];
            var diff12 = new THREE.Vector3();
            var diff13 = new THREE.Vector3();
            diff12.subVectors(plane[0], plane[1]);
            diff13.subVectors(plane[0], plane[2]);
            var normal = new THREE.Vector3();
            normal.crossVectors(diff12, diff13).normalize();


            var quat = GeometryUtils.quaternionFromVectors(new THREE.Vector3(normal.x, normal.y, normal.z), new THREE.Vector3(0, 1, 0));

            node.quaternion.set(quat.x, quat.y, quat.z, quat.w);
            node.geometry.computeBoundingBox();

            return node;
        }

        public static convertThreeToAmmoGeometry(mesh: THREE.Mesh): Array<Ammo.btVector3> {
            var vertices: Array<Ammo.btVector3>;

            vertices = mesh.geometry.vertices.map((vertex) => new Ammo.btVector3(vertex.x, vertex.y, vertex.z));

            return vertices;
        }

        /*
            Normalize any value in the cycling range from start to end
        */
        public static normalize(value: number, start: number, end: number): number {
            var width = end - start   ;   //
            var offsetValue = value - start;   // value relative to 0

            return (offsetValue - (Math.floor(offsetValue / width) * width)) + start;
            // + start to reset back to start of original range
        }

        public static almostZero(value: number): boolean {
            return Math.abs(value) <= 1e-6;
        }
    }
}