/// <reference path="Editor.js" />
/// <reference path="libs/signals.min.js" />
var Thralldom = {};
Thralldom.Exporter = function (editor) {
    editor = editor || new Editor();

    var scene = [];
    var navmesh = {
        nodes: [],
        edges: [],
    }

    var isStateValid = true;

    editor.signals.objectAdded.add(function (object) {
        scene.push(object);
    });

    editor.signals.objectRemoved.add(function (object) {
        var i = scene.indexOf(object);
        if (i != -1) {
            scene[i] = scene[scene.length - 1];
            scene.pop();
        }
    });

    function printObjectInfo(value) {
        return "Model " + value.name + " with coordinates at (" + value.position.x + ", " + value.position.y + ", " + value.position.z + ").";
    }

    function exportObject(object, index) {
        var precision = 3;
        var sx = object.scale.x.toFixed(precision),
            sy = object.scale.y.toFixed(precision),
            sz = object.scale.z.toFixed(precision);
        
        if (sx != sy || sx != sz || sy != sz) {
            alert("ERROR: " + printObjectInfo(object) + "Different scaling weights per axis");
            isStateValid = false;
            return;
        }

        if (object.userData.tags && !(object.userData.tags instanceof Array)) {
            alert("ERROR: " + printObjectInfo(object) + "Tags is not an array!")
            isStateValid = false;
            return;
        }

        return {
            type: object.userData.exportAs.toLowerCase(),
            pos: [object.position.x, object.position.y, object.position.z],
            rot: [object.rotation.x, object.rotation.y, object.rotation.z],
            scale: object.scale.x,
            model: object.name,
            id: object.userData.id,
            tags: object.userData.tags,
        }
    }

    function exportWaypointPath(nodes, edges, object) {
        if (!(object instanceof THREE.Line)) {
            console.warn("Something other from a line marked as a waypoint, ignoring");
            return;
        }
        var p = object.geometry.vertices[0],
            q = object.geometry.vertices[1];

        p.applyMatrix4(object.matrix);
        q.applyMatrix4(object.matrix);
        var firstNode = new THREE.Vector2(p.x, p.z);
        var secondNode = new THREE.Vector2(q.x, q.z);

        var errorMargin = 10;

        var firstIndex = -1;
        var firstCloseEnough = nodes.filter(function (value, index) {
            if (value.distanceToSquared(firstNode) <= errorMargin) {
                firstIndex = index;
            }
        });
        if (firstIndex == -1) {
            nodes.push(firstNode);
            firstIndex = nodes.length - 1;
        }

        var secondIndex = -1;
        var secondCloseEnough = nodes.filter(function (value, index) {
            if (value.distanceToSquared(secondNode) <= errorMargin) {
                secondIndex = index;
            }
        });
        if (secondIndex == -1) {
            nodes.push(secondNode);
            secondIndex = nodes.length - 1;
        }

        edges.push([firstIndex, secondIndex]);

    }

    function getFilterPredicate(value) {
        return function (object) {
            return object.userData.exportAs == value;
        }
    }

    function prettyJsonStringify(data) {
        var result = "{\r\n";
        for (var prop in data) {
            result += prop + ": " + JSON.stringify(data[prop]) + ",\r\n";
        }
        result += "}"
        return result;
    }


    function exportNavMesh(defaultHeight, cw, ch, maxSlope, shouldVisualize) {
        var terrain = scene.filter(getFilterPredicate("Terrain"))[0];

        var dx = Math.sqrt(cw * cw + ch * ch);

        var raycaster = new THREE.Raycaster();
        var down = new THREE.Vector3(0, -1, 0);

        var visited = [];

        var nodes = navmesh.nodes = [],
            edges = navmesh.edges = [];
        function tryAddNode(row, col, parent, parentIndex) {
            // The following is a bijection from Z to N. See here http://math.stackexchange.com/questions/187751/cardinality-of-the-set-of-all-pairs-of-integers
            var mappedRow = row < 0 ? -(2 * row + 1) : 2 * row + 2,
                mappedCol = col < 0 ? -(2 * col + 1) : 2 * col + 2;
            // The following is a bijection from N^2 to N. See here http://www.physicsforums.com/showthread.php?t=536900
            var code = ((mappedRow + mappedCol) * (mappedRow + mappedCol) + 3 * mappedRow + mappedCol) / 2;
            if (visited[code]) return;

            visited[code] = true;
            var mid = new THREE.Vector3(cw * (col + 0.5), defaultHeight, ch * (row + 0.5));
            raycaster.set(mid, down);
            var result = raycaster.intersectObjects(scene);

            var hitIndex = 0;
            var firstHit;
            do firstHit = result[hitIndex++];
            while (firstHit && firstHit.object.userData.exportAs != "Environment" && firstHit.object != terrain)

            // No appropriate hit
            if (!firstHit) return;

            if (firstHit.object == terrain) {
                var hit = firstHit.point;
                var dh = parent !== undefined ? Math.abs(hit.y - parent.y) : 0;
                var slope = dh / dx;
                if (slope < maxSlope) {
                    nodes.push([mid.x, mid.z]);
                    var index = nodes.length - 1;
                    if (parentIndex !== undefined)
                        edges.push([parentIndex, index]);

                    tryAddNode(row + 1, col, hit, index);
                    tryAddNode(row - 1, col, hit, index);
                    tryAddNode(row, col + 1, hit, index);
                    tryAddNode(row, col - 1, hit, index);
                }
            }
        }

        var hero = scene.filter(function (o) { o.userData.id == "hero" })[0];
        var initialRow = 0, initialCol = 0;
        if (hero) {
            initialRow = hero.position.x / cw;
            initialCol = hero.position.y / ch;
        }
        tryAddNode(initialRow, initialCol, undefined, undefined);

        var name = "NAVMESHVISUALIZER";
        var previous = editor.scene.getObjectByName(name);
        if (previous) editor.removeObject(previous);
        if (shouldVisualize) {

            var obj = new THREE.Object3D();
            obj.name = name;
            nodes.forEach(function (n) {
                var geometry = new THREE.BoxGeometry(cw, defaultHeight, ch);
                var mat = new THREE.MeshNormalMaterial();
                var mesh = new THREE.Mesh(geometry, mat);
                mesh.position.set(n[0], defaultHeight / 2, n[1]);
                obj.add(mesh);
            })
            editor.addObject(obj);
        }
    }

    function exportScene() {
        isStateValid = true;

        var env = scene.filter(getFilterPredicate("Environment")).map(exportObject);
        var characters = scene.filter(getFilterPredicate("Character")).map(exportObject);
        var terrain = scene.filter(getFilterPredicate("Terrain"));
        if (terrain.length == 0) {
            var msg = "No terrain specified";
            console.Error(msg);
            alert(msg);
        }
        if (terrain.length > 1) {
            console.warn("More than one mesh marked as terrain, only the first will be xported");
        }
        if (terrain[0]) {
            var terrainDescriptor = {};
            terrainDescriptor.scale = terrain[0].scale.x;
            terrainDescriptor.model = terrain[0].name;

            terrain = terrainDescriptor
        }
        else {
            terrain = undefined;
        }
        if (!isStateValid)
            return;

        var data = {
            "statics": env,
            "dynamics": characters,
            "terrain": terrain,
            "navmesh": navmesh,
        }

        var blob = new Blob([prettyJsonStringify(data)], { type: 'text/plain' });
        var objectURL = URL.createObjectURL(blob);

        window.open(objectURL, '_blank');
        window.focus();
    }


    return  {
        exportScene: exportScene,
        generateNavMesh: exportNavMesh,
        scene: scene,
    };
};