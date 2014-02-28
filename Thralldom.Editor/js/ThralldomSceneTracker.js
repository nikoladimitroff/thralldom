/// <reference path="Editor.js" />
/// <reference path="libs/signals.min.js" />
var Thralldom = {};
Thralldom.Scene = function (editor) {
    editor = editor || new Editor();

    var enviroment = [];

    editor.signals.objectAdded.add(function (object) {
        if (object.geometry) {
            enviroment.push(object);
        }
    });

    editor.signals.objectRemoved.add(function (object) {
        if (object.geometry) {
            var i = enviroment.indexOf(object);
            if (i != -1) {
                enviroment[i] = enviroment[enviroment.length - 1];
                enviroment.pop();
            }
        }
    });

    function printObjectInfo(value) {
        return "Model " + value.name + " with coordinates at (" + value.position.x + ", " + value.position.y + ", " + value.position.z + ").";
    }

    function exportScene() {
        var isValid = true;

        function exportObject(value, index) {
            if (value.scale.x != value.scale.y || value.scale.x != value.scale.z || value.scale.y != value.scale.z) {
                alert("ERROR: " + printObjectInfo(value) + "Different scaling weights per axis");
                isValid = false;
                return;
            }

            if (value.userData.tags && !(value.userData.tags instanceof Array)) {
                alert("ERROR: " + printObjectInfo(value) + "Tags is not an array!")
                isValid = false;
                return;
            }

            return {
                type: "environment",
                pos: [value.position.x, value.position.y, value.position.z],
                rot: [value.rotation.x, value.rotation.y, value.rotation.z],
                scale: value.scale.x,
                model: value.name,
                id: value.userData.id,
                tags: value.userData.tags,
            }
        }

        var output = JSON.stringify(enviroment.map(exportObject));

        if (!isValid)
            return;


        var blob = new Blob([output], { type: 'text/plain' });
        var objectURL = URL.createObjectURL(blob);

        window.open(objectURL, '_blank');
        window.focus();
    }

    return {
        exportScene: exportScene
    };
};