/// <reference path="Editor.js" />
/// <reference path="libs/signals.min.js" />
var Thralldom = {};
Thralldom.Exporter = function (editor) {
    editor = editor || new Editor();

    var scene = [];

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
        if (object.scale.x != object.scale.y || object.scale.x != object.scale.z || object.scale.y != object.scale.z) {
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

    function exportScene() {
        isStateValid = true;

        var env = scene.filter(getFilterPredicate("Environment")).map(exportObject);
        var characters = scene.filter(getFilterPredicate("Character")).map(exportObject);
        var terrain = scene.filter(getFilterPredicate("Terrain"));
        if (terrain.length > 1) {
            console.warn("More than one mesh marked as terrain, only the first will be xported");
            if (terrain[0]) {
                var terrainDescriptor = {};
                terrainDescriptor.scale = terrain[0].scale;
                terrainDescriptor.model = terrain.name;
            }
        }

        var nodes = [],
            edges = [];
        var waypoints = scene.filter(getFilterPredicate("Waypoint Path")).forEach(exportWaypointPath.bind(undefined, nodes, edges));
        nodes = nodes.map(function (p) { return [p.x, p.y]; });
        var graph = {
            nodes: nodes,
            edges: edges,
        }

        if (!isStateValid)
            return;

        var data = {
            "statics": env,
            "dynamics": characters,
            "terrain": terrain,
            "graph": graph,
        }

        var blob = new Blob([JSON.stringify(data)], { type: 'text/plain' });
        var objectURL = URL.createObjectURL(blob);

        window.open(objectURL, '_blank');
        window.focus();
    }

    return {
        exportScene: exportScene
    };
};