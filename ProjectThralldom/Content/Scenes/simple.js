{
    // Settings below for various things
    settings: {
            attachDebuggingVisuals: true,
            },
    controller: {
            angularSpeed: 10 * Math.PI,
            },
    character: {
        "*": {
            mass: 70,
            jumpImpulse: 200,
            viewAngle: Math.PI / 3,
            movementSpeed: 0.1 * 1e3,
            sprintMultiplier: 2,
            },
        ".guard": {
                movementSpeed: 0.1 * 1e3,
                },
    },
    physics: {
            friction: 1,
            restitution: 0,
            linearDamping: 0.7,
            angularDamping: 1,
            gravity: -30,
            },
    lights: [
        {
            type: "ambient",
            color: 0xFFFFFF,
        },
        {
            type: "directional",
            color: 0xFFFFFF,
            intensity: 1,
            position: [2, 1, 1],
        }
    ],
    // No more settings, scene definition
    terrain: {
        scale: 30,
        texture: "Grass.jpg",
        repeatTexture: true,
        // If a model is provided, the texture above is ignored
        model: "terrain.js",
        },
    skybox: {
            scale: 5000,
            textures: [
                    "Content/Textures/Skyboxes/Night/posX.png", 
                    "Content/Textures/Skyboxes/Night/negX.png", 
                    "Content/Textures/Skyboxes/Night/posY.png", 
                    "Content/Textures/Skyboxes/Night/negY.png", 
                    "Content/Textures/Skyboxes/Night/posZ.png",
                    "Content/Textures/Skyboxes/Night/negZ.png", 
            ],
            },
    waypoints: {
            nodes: [[-393.82, 51.73], [90.60330488167114, 120.77182926800373], [-258.4222199467363, 208.32359567890623], [300.4222199467363, 208.32359567890623], [100, -130],],
            edges: [[0, 1], [1, 2], [2, 3], [3, 4]],
            },
    dynamics: [
        {
            type: "character",
            tags: ["skyrim"],
            id: "hero",
            model: "BoychoAnimation.js",
            weapon: "PistolAnimation.js",
            pos: [30, 1, 0],
            rot: [0, -0.668, 0],
            scale: 0.4,
        },
        {
            type: "character",
            tags: ["statue"],
            id: "sokolov",
            model: "SokolovAnimation.js",
            weapon: "PistolAnimation.js",
            pos: [-6, 1, -34.574],
            rot: [0, -1.206, 0],
            scale: 0.4,
        },
        {
            type: "character",
            tags: ["npc", "guard"],
            id: "enemy",
            model: "BoychoAnimation.js",
            weapon: "PistolAnimation.js",
            pos: [-34, 1, -6],
            scale: 0.4,
        },
    ],
    statics: [
        {
            "type":"environment",
            "pos":[21.182033655203398,0,-0.05357572014003853],
            "rot":[3.141592653589793,1.5606423359643475,3.141592653589793],
            "scale":1,
            "model":"House_03.js",
            "id":"",
            "tags":[],
            "interaction": {
                type: "quest",
                quest: "A side quest",
            },
        },
        {
           "type":"environment",
            "pos":[-21.182033655203398,0,-0.05357572014003853],
            "rot":[3.141592653589793,1.5606423359643475,3.141592653589793],
            "scale":1,
            "model":"House_03.js",
            "id":"",
            "tags":[],
            "interaction": {
                type: "item",
                itemCode: 0x01,
                quantity: 1,
            },
        }
           /*
            * "interaction": {
            *     type: "script",
            *     itemCode: 0x0,
            *     quantity: 1
            * }
            */
           /*
            * "interaction": {
            *     type: "script",
            *     script: "frominteraction",
            * } 
            * }
            */
           
           /*
            * interaction: {
            *   type: "quest",
            *   quest: "random-side-quest",
            *   
            * }
            */
       ]
}