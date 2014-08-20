module Thralldom {
    export class Pathfinder {
        public static Graph: Algorithms.IGraph;
        public static NavmeshVisualizer: THREE.Object3D;

        public static getRectangle(vec: THREE.Vector3): Algorithms.Rectangle {
            var pos = GeometryUtils.Vector3To2(vec);

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
    } 
} 