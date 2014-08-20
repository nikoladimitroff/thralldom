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
        var sx = parseFloat(object.scale.x.toFixed(precision)),
            sy = parseFloat(object.scale.y.toFixed(precision)),
            sz = parseFloat(object.scale.z.toFixed(precision));
        
        if (sx != sy || sx != sz || sy != sz) {
            var message = "ERROR: " + printObjectInfo(object) + "Different scaling weights per axis! \nWant me to set all scaling equal to scale.x?";
            var answer = confirm(message);
            if (answer) {
                object.scale.x = object.scale.y = object.scale.z = sx;
            }
            else {
                isStateValid = false;
                return;
            }
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
                            size, defaultHeight,
                            terrain,
                            visited, nodes) {

        var raycaster = new THREE.Raycaster();
        var down = new THREE.Vector3(0, -1, 0);
        var dx = Math.sqrt(2 * size * size);
        return function tryAddNode(row, col, parent) {
            // The following is a bijection from Z to N. See here http://math.stackexchange.com/questions/187751/cardinality-of-the-set-of-all-pairs-of-integers
            var mappedRow = row < 0 ? -(2 * row + 1) : 2 * row + 2,
                mappedCol = col < 0 ? -(2 * col + 1) : 2 * col + 2;
            // The following is a bijection from N^2 to N. See here http://www.physicsforums.com/showthread.php?t=536900
            var code = ((mappedRow + mappedCol) * (mappedRow + mappedCol) + 3 * mappedRow + mappedCol) / 2;
            if (visited[code]) return;

            visited[code] = true;

            var mid = new THREE.Vector3(size * (col + 0.5), defaultHeight, size * (row + 0.5));
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

                    tryAddNode(row + 1, col, hit);
                    tryAddNode(row - 1, col, hit);
                    tryAddNode(row, col + 1, hit);
                    tryAddNode(row, col - 1, hit);

                    return;
                }
            }
        }
    }

    function visualizeNavmesh(nodes, size, defaultHeight, shouldVisualize) {
        var name = "NAVMESHVISUALIZER";
        var previous = editor.scene.getObjectByName(name);
        if (previous) editor.removeObject(previous);

        if (shouldVisualize) {
            var obj = new THREE.Object3D();
            obj.name = name;
            nodes.forEach(function (n) {
                var geometry = new THREE.BoxGeometry(size, defaultHeight, size);
                var mat = new THREE.MeshNormalMaterial();
                var mesh = new THREE.Mesh(geometry, mat);
                mesh.position.set(n[0], defaultHeight / 2, n[1]);
                obj.add(mesh);
            })
            editor.addObject(obj);
        }
    }

    function buildNodes(defaultHeight, size, maxSlope, shouldVisualize) {
        var terrain = scene.filter(getFilterPredicate("Terrain"))[0];

        // Visited is a map from an unique code computed from the coordinates to the index of the nodes or
        // -1 if the node should not be created or undefined if the node hasn't been visited
        var visited = [];

        var nodes = [];


        var hero = scene.filter(function (o) { o.userData.id == "hero" })[0];
        var initialRow = 0, initialCol = 0;
        if (hero) {
            initialRow = hero.position.x / size;
            initialCol = hero.position.y / size;
        }

        var tryAddNode = bindTryAddNode(maxSlope,
                                        size, defaultHeight,
                                        terrain,
                                        visited, nodes);

        tryAddNode(initialRow, initialCol, undefined, undefined);
        visualizeNavmesh(nodes, size, defaultHeight, shouldVisualize);
        return nodes;
    }


    function buildNavmesh(nodes, cellSize) {
        var X = nodes.map(function (n) { return n[0]; }),
            Z = nodes.map(function (n) { return n[1]; });

        var minX = Math.min.apply(undefined, X),
            minZ = Math.min.apply(undefined, Z),
            maxX = Math.max.apply(undefined, X),
            maxZ = Math.max.apply(undefined, Z);

        var size = cellSize;
        var colCount = (maxX - minX) / size + 1, rowCount = (maxZ - minZ) / size;
        var matrix = [];

        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i] === null) continue;

            var colIndex = (nodes[i][0] - minX) / size;
            var rowIndex = (nodes[i][1] - minZ) / size;
            if (!matrix[rowIndex]) matrix[rowIndex] = [];

            matrix[rowIndex][colIndex] = { x: nodes[i][0], y: nodes[i][1], col: colIndex, row: rowIndex };
        }

        function nextCell(matrix) {
            var row = 0, col = 0;
            while (row <= rowCount) {
                if (matrix[row][col] !== undefined)
                    return { row: row, col: col };

                col++;
                if (col >= colCount) {
                    row++;
                    col = 0;
                }
            }
            return null;
        }

        function testSubrow(matrix, row, from, to) {
            for (var col = from; col < to; col++) {
                if (matrix[row][col] == undefined)
                    return false;
            }
            return true;
        }

        function findMaxRect(matrix, topleft, rowCount, colCount) {
            var w = 1,
                h = 1;
            while (topleft.col + w < colCount && matrix[topleft.row][topleft.col + w] != undefined) w++;
            while (topleft.row + h < rowCount && h <= 2 * w) {
                var isClean = testSubrow(matrix, topleft.row + h, topleft.col, topleft.col + w);
                if (!isClean)
                    break;
                h++;
            }

            var rect = { x: topleft.col, y: topleft.row, width: w, height: h };

            return rect;
        }

        function cleanRect(matrix, rect) {
            var maxY = rect.y + rect.height;
            var maxX = rect.x + rect.width;
            for (var i = rect.y; i < maxY; i++) {
                for (var j = rect.x; j < maxX; j++) {
                    matrix[i][j] = undefined;
                }
            }
        }

        function expandRect(rect) {
            rect.x = rect.x * size + minX;
            rect.y = rect.y * size + minZ;
            rect.width *= size;
            rect.height *= size;
            return rect;
        }

        function hashRect(rect) {
            // NOTE: THE IMPORTER MUST USE THE SAME CODE!
            // Rectangles are nonoverlapping thus we only need their toplefties
            var hash = 23;
            hash = hash * 31 + rect.x;
            hash = hash * 31 + rect.y;
            return hash;
        }

        function generateEdges(navmesh) {
            var edges = {};
            for (var i = 0; i < navmesh.length; i++) {
                var rect1 = navmesh[i];
                var h1 = hashRect(rect1);
                if (edges[h1] === undefined)
                    edges[h1] = [];
                for (var j = i + 1; j < navmesh.length; j++) {
                    var rect2 = navmesh[j];

                    if (rect1.x <= rect2.x + rect2.width && rect2.x <= rect1.x + rect1.width &&
                        rect1.y <= rect2.y + rect2.height && rect2.y <= rect1.y + rect1.height) {

                        var h2 = hashRect(rect2);
                        if (edges[h2] === undefined)
                            edges[h2] = [];
                        edges[h1].push(j);
                        edges[h2].push(i);
                    }
                }
            }
            return edges;
        }

        function generateNavmesh() {
            var navmesh = [];
            var topleft = nextCell(matrix);
            var c = 0;
            while (topleft && topleft.row <= rowCount && topleft.col <= colCount) {
                var rect = findMaxRect(matrix, topleft, rowCount, colCount);
                cleanRect(matrix, rect);
                navmesh.push(expandRect(rect));
                topleft = nextCell(matrix);
            }

            edges = generateEdges(navmesh);
            return {
                rowCount: rowCount,
                colCount: colCount,
                size: size,
                nodes: navmesh,
                edges: edges,
            };
        }

        return generateNavmesh();
    }

    function exportNavmesh(defaultHeight, size, maxSlope, factor, shouldVisualize) {
        scaleEnvironment(factor);
        var nodes = buildNodes(defaultHeight, size, maxSlope, shouldVisualize);
        scaleEnvironment(1 / factor);
        navmesh = buildNavmesh(nodes, size);
    }

    function inspectMesh() {
        localStorage.setItem("thralldom_navmesh", JSON.stringify(navmesh));
        window.open("navmesh.html", "_blank");
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
        inspectMesh: inspectMesh,
        scene: scene,
    };
};