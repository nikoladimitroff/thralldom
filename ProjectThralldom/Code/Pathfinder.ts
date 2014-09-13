module Thralldom {
    export class Pathfinder {
        public static Graph: Algorithms.IGraph;
        public static NavmeshVisualizer: THREE.Object3D;

        public static getRectangle(vec: THREE.Vector2): Algorithms.Rectangle;
        public static getRectangle(vec: THREE.Vector3): Algorithms.Rectangle;

        public static getRectangle(pos: any): Algorithms.Rectangle {
            if (pos.constructor === THREE.Vector3)
                pos = GeometryUtils.Vector3To2(pos);

            var nodes = Pathfinder.Graph.nodes;
            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                if (node.contains(pos))
                    return node;
            }
            return undefined;
        }

        public static getClosestRectangle(vec: THREE.Vector2): Algorithms.Rectangle;
        public static getClosestRectangle(vec: THREE.Vector3): Algorithms.Rectangle;

        public static getClosestRectangle(pos: any): Algorithms.Rectangle {
            if (pos.constructor === THREE.Vector3)
                pos = GeometryUtils.Vector3To2(pos);

            var nodes = Pathfinder.Graph.nodes;
            var minRect = nodes[0];
            var minDist = pos.distanceToSquared(minRect.center);
            for (var i = 1; i < nodes.length; i++) {
                var node = nodes[i];
                var distance = pos.distanceToSquared(minRect.center);
                if (distance < minDist) {
                    minRect = node;
                    minDist = distance
                }
            }
            return minRect;
        }

        public static query(character: Character, goal: THREE.Vector2): Array<Pair<THREE.Vector2, Algorithms.Rectangle>> {
            var start = <any>GeometryUtils.Vector3To2(character.mesh.position);

            var path = Algorithms.AStar.runQueryOnVectors(Pathfinder.Graph, start, goal);
            var completed = Pathfinder.completePath(path, start, goal, character.radius, character);


            if (Pathfinder.NavmeshVisualizer) {
                var lineId = character.id + "TARGET";
                Pathfinder.NavmeshVisualizer.remove(Pathfinder.NavmeshVisualizer.getObjectByName(lineId, false));
                Pathfinder.NavmeshVisualizer.add(GeometryUtils.getLine(completed.map(pair => pair.first), -character.centerToMesh.y, lineId));
            }
            return completed;
        }
        


        private static completePath(path: Array<Algorithms.Rectangle>, start: THREE.Vector2, goal: THREE.Vector2, radius: number, character):
            Array<Pair<THREE.Vector2, Algorithms.Rectangle>> {

            var completed = new Array<Pair<THREE.Vector2, Algorithms.Rectangle>>();
            completed.push(new Pair(start, path[0]));

            var currentNode: number = 0;
            for (var i = 1; i < path.length - 1; i++) {
                var closestToCurrent = Pathfinder.closestPoint(completed[i - 1].first, path[i], path[i + 1], radius),
                    closestToGoal = Pathfinder.closestPoint(goal, path[i], path[i + 1], radius);
                var nextPoint = closestToCurrent.add(closestToGoal).multiplyScalar(0.5);
                completed.push(new Pair(nextPoint, path[i + 1]));
            }
            completed.push(new Pair(goal, path[path.length - 1]));

            Pathfinder.straightenPath(completed);
            Pathfinder.curvePath(completed);

            return completed;
        }

        private static curvePath(path: Array<Pair<THREE.Vector2, Algorithms.Rectangle>>): void {

            var step = 0.1;
            for (var i = 1; i < path.length - 1; i++) {
                var left = path[i - 1],
                    middle = path[i],
                    right = path[i + 1];

                var curve = new THREE.QuadraticBezierCurve(left.first, middle.first, right.first);

                var generatedPoints = <any>[
                    // Push the first parameters of splice here
                    i,
                    1,
                ]
                // The points themselves
                for (var j = 1; j < 1 / step - 1; j++)
                    generatedPoints.push(new Pair(curve.getPoint(j * step), j * step < 0.5 ? left.second : right.second));

                Array.prototype.splice.apply(path, generatedPoints);
                i += generatedPoints.length - 2;
            }
        }

        private static straightenPath(path: Array<Pair<THREE.Vector2, Algorithms.Rectangle>>): void {
            var p1 = 0,
                p2 = 1,
                p3 = 2;

            while (path.length > 2 && p3 <= path.length - 1) {
                if (Pathfinder.isVisibleFrom(path[p1].first, path[p3].first)) {
                    path.splice(p2, 1);
                    p3++;
                }
                else {
                    p1 = p2;
                    p2 = p3;
                    p3++;
                }
            }
        }

        // Returns true if there's a straight line from p1 to p2 trough the navmesh
        private static isVisibleFrom(p1: THREE.Vector2, p2: THREE.Vector2): boolean {
            var direction = (new THREE.Vector2()).subVectors(p2, p1);
            direction.normalize();
            var stepSize = Pathfinder.Graph.size * 0.75; // Stepping step = graph.size may skip a rectangle, thus reduce it a little bit
            var stepSquared = stepSize * stepSize;
            direction.multiplyScalar(stepSize);

            // Raycast ahead and see if there's a crossing
            var result = (new THREE.Vector2()).copy(p1);
            while (result.distanceToSquared(p2) >= stepSquared) {
                var rectangle = Pathfinder.getRectangle(result);
                if (!rectangle)
                    return false;

                result.add(direction);
            }

            return true;
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
            //if (lambda < 0 || lambda > 1)
            //    throw new Error("Unpassable terrain found while pathfinding");

            return new THREE.Vector2(
                lambda * p.x + (1 - lambda) * q.x,
                lambda * p.y + (1 - lambda) * q.y
                );
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

        public static toggleVisualization(): void {
            if (this.NavmeshVisualizer)
                this.NavmeshVisualizer.visible = !this.NavmeshVisualizer.visible;
        }
    } 
} 