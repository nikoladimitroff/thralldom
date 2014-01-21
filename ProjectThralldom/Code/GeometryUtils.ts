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
    }
}