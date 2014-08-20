module Thralldom {
    export class Pathfinder {
        public static Graph: Algorithms.IGraph;
        public static NavmeshVisualizer: THREE.Object3D;

        public static getRectangle(vec: THREE.Vector2): Algorithms.Rectangle;
        public static getRectangle(vec: THREE.Vector3): Algorithms.Rectangle;

        public static getRectangle(pos: any): Algorithms.Rectangle {
            if (pos.constructor == THREE.Vector3)
                pos = GeometryUtils.Vector3To2(pos);

            var nodes = Pathfinder.Graph.nodes;
            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                if (node.contains(pos))
                    return node;
            }
        }

        public static query(start: THREE.Vector3, goal: THREE.Vector3): Array<Algorithms.Rectangle>;
        public static query(start: THREE.Vector2, goal: THREE.Vector2): Array<Algorithms.Rectangle>;

        public static query(start: any, goal: any): Array<Algorithms.Rectangle> {
            return Algorithms.AStar.runQueryOnVectors(Pathfinder.Graph, start, goal);
        }

        public static addNavmesh(scene: THREE.Scene, height: number): void {
            var nodes = Pathfinder.Graph.nodes;
            scene.remove(Pathfinder.NavmeshVisualizer);
            Pathfinder.NavmeshVisualizer = new THREE.Object3D();
            Pathfinder.NavmeshVisualizer.visible = false;
            for (var i = 0; i < nodes.length; i++) {
                var r = nodes[i];
                var geometry = new THREE.BoxGeometry(r.width, 1, r.height);
                var material = new THREE.MeshLambertMaterial();
                material.opacity = 0.4;
                material.transparent = true;
                material.ambient = new THREE.Color(Utils.randomColor());

                var box = new THREE.Mesh(geometry, material);
                box.position.x = r.x + r.width / 2;
                box.position.z = r.y + r.height / 2;
                box.position.y = height;
                Pathfinder.NavmeshVisualizer.add(box);
            }
            scene.add(Pathfinder.NavmeshVisualizer);
        }


        // Finds the point P closest to pos for which the following holds:
        // - currentRect and nextRect are neighbours
        // - P lies in nextRect
        // - distance from P to any corner of nextRect is no less than radius
        public static closestPoint(pos: THREE.Vector2,
            currentRect: Algorithms.Rectangle,
            nextRect: Algorithms.Rectangle,
            radius: number): THREE.Vector2 {

            var points = currentRect.points.concat(nextRect.points)
                .filter(p => currentRect.contains(p) && nextRect.contains(p));

            if (points.length == 3) { // The rectangles share a point, find the duplicate and remove it
                if (points[0].x == points[1].x && points[0].y == points[1].y)
                    points.shift();
                else
                    points.pop();
            }


            if (points.length != 2)
                console.error("SOMETHING AWFUL HAPPENED DURING PATHFINDING");

            var p = points[0],
                q = points[1];

            var u = (new THREE.Vector2()).subVectors(p, q);

            var v = (new THREE.Vector2()).subVectors(q, pos);

            var a = u.x * u.x + u.y * u.y,
                b = 2 * (u.x * v.x + u.y * v.y),
                c = v.x * v.x + v.y * v.y;

            var vertex = - b / (2 * a);

            var dist = p.distanceTo(q);
            var acceptableRatio = radius / dist;
            var leftEnd = acceptableRatio,
                rightEnd = 1 - acceptableRatio;


            var lambda = null;
            if (vertex >= leftEnd && vertex <= rightEnd) {
                lambda = vertex;
            }
            else {
                var fLeft = a * leftEnd * leftEnd + b * leftEnd + c,
                    fRight = a * rightEnd * rightEnd + b * rightEnd + c;

                if (fLeft < fRight)
                    lambda = leftEnd
                else
                    lambda = rightEnd;
            }
            if (lambda < 0 || lambda > 1)
                throw new Error("Unpassable terrain found while pathfinding");

            return new THREE.Vector2(
                lambda * p.x + (1 - lambda) * q.x,
                lambda * p.y + (1 - lambda) * q.y
                );
        }
    } 
} 