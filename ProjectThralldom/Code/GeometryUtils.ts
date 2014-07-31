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

        public static getQuestMarker(content: ContentManager): THREE.Mesh {
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

            var material = new THREE.MeshPhongMaterial({ map: content.getContent("Content/Textures/RedChecker.png") });

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
            node.scale.divideScalar(20);

            return node;
        }

        public static getTrajectoryLine(from: THREE.Vector3, to: THREE.Vector3, color: number): THREE.Line {
            var lineGeom = new THREE.Geometry();
            lineGeom.vertices.push(from);
            lineGeom.vertices.push(new THREE.Vector3(to.x, to.y, to.z));

            var line = new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: color }));
            line.name = "debug";

            return line;
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

        public static almostZero(value: number, precision: number = 1e-6): boolean {
            return GeometryUtils.almostEquals(value, 0, precision);
        }

        public static almostEquals(value1: number, value2: number, precision: number = 1e-6): boolean {
            return Math.abs(value1 - value2) <= Math.abs(precision);
        }

        public static Vector3To2(vec: THREE.Vector3): THREE.Vector2 {
            return new THREE.Vector2(vec.x, vec.z);
        }

        public static Vector2To3(vec: THREE.Vector2): THREE.Vector3 {
            return new THREE.Vector3(vec.x, 0, vec.y);
        }
    }
}