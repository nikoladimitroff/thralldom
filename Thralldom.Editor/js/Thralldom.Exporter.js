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
        function fixDecimals(num) {
            return num.toFixed(precision);
        }

        return {
            type: object.userData.exportAs.toLowerCase(),
            pos: [object.position.x, object.position.y, object.position.z].map(fixDecimals),
            rot: [object.rotation.x, object.rotation.y, object.rotation.z].map(fixDecimals),
            scale: sx,
            model: object.name,
            id: object.userData.id,
            tags: object.userData.tags,
        }
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

    function scaleEnvironment(factor) {
        for (var i = 0; i < scene.length; i++) {
            if (scene[i].userData.exportAs == "Environment") {
                console.log("BEFORE", scene[i].scale.x, scene[i].scale.z)
                scene[i].scale.x *= factor;
                scene[i].scale.z *= factor;
                scene[i].updateMatrixWorld(true);
                console.log("AFTER", scene[i].scale.x, scene[i].scale.z)
            }
        }
    }

    function bindTryAddNode(maxSlope,
                            cw, ch, defaultHeight,
                            terrain,
                            visited, nodes, edges) {

        var raycaster = new THREE.Raycaster();
        var down = new THREE.Vector3(0, -1, 0);
        var dx = Math.sqrt(cw * cw + ch * ch);
        return function tryAddNode(row, col, parent, parentIndex) {
            // The following is a bijection from Z to N. See here http://math.stackexchange.com/questions/187751/cardinality-of-the-set-of-all-pairs-of-integers
            var mappedRow = row < 0 ? -(2 * row + 1) : 2 * row + 2,
                mappedCol = col < 0 ? -(2 * col + 1) : 2 * col + 2;
            // The following is a bijection from N^2 to N. See here http://www.physicsforums.com/showthread.php?t=536900
            var code = ((mappedRow + mappedCol) * (mappedRow + mappedCol) + 3 * mappedRow + mappedCol) / 2;

            if (visited[code] === -1) return;
            if (visited[code] !== undefined) {
                edges.push([parentIndex, visited[code]])
                return;
            }

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
                    visited[code] = index;
                    if (parentIndex !== undefined)
                        edges.push([parentIndex, index]);

                    // Direct neighbours
                    tryAddNode(row + 1, col, hit, index);
                    tryAddNode(row - 1, col, hit, index);
                    tryAddNode(row, col + 1, hit, index);
                    tryAddNode(row, col - 1, hit, index);
                    // Diagonals
                    tryAddNode(row + 1, col + 1, hit, index);
                    tryAddNode(row + 1, col - 1, hit, index);
                    tryAddNode(row - 1, col + 1, hit, index);
                    tryAddNode(row - 1, col - 1, hit, index);

                    return;
                }
            }
            visited[code] = -1;
        }
    }

    function visualizeNavmesh(nodes, cw, ch, defaultHeight, shouldVisualize) {
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

    function generateNavmesh(defaultHeight, cw, ch, maxSlope, shouldVisualize) {
        var terrain = scene.filter(getFilterPredicate("Terrain"))[0];

        // Visited is a map from an unique code computed from the coordinates to the index of the nodes or
        // -1 if the node should not be created or undefined if the node hasn't been visited
        var visited = [];

        var nodes = navmesh.nodes = [],
            edges = navmesh.edges = [];


        var hero = scene.filter(function (o) { o.userData.id == "hero" })[0];
        var initialRow = 0, initialCol = 0;
        if (hero) {
            initialRow = hero.position.x / cw;
            initialCol = hero.position.y / ch;
        }

        var tryAddNode = bindTryAddNode(maxSlope,
                                        cw, ch, defaultHeight,
                                        terrain,
                                        visited, nodes, edges);

        tryAddNode(initialRow, initialCol, undefined, undefined);
        visualizeNavmesh(nodes, cw, ch, defaultHeight, shouldVisualize);
    }

    function exportNavmesh(defaultHeight, cw, ch, maxSlope, factor, shouldVisualize) {
        scaleEnvironment(factor);
        generateNavmesh(defaultHeight, cw, ch, maxSlope, shouldVisualize);
        scaleEnvironment(1 / factor);
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
        exportNavmesh: exportNavmesh,
        scaleEnvironment: scaleEnvironment,
        scene: scene,
    };
};