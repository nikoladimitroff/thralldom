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
            jumpImpulse: 2500,
            viewAngle: Math.PI / 3,
            movementSpeed: 1 * 1e3,
            sprintMultiplier: 2,
        },
        ".guard": {
            movementSpeed: 0.5 * 1e3,
        },
    },
    physics: {
        friction: 1,
        restitution: 0,
        linearDamping: 0.7,
        angularDamping: 1,
        gravity: -9.8,
    },
    // No more settings, scene definition
    terrain: {
        scale: 2000,
        texture: "Grass.jpg",
        repeatTexture: true,
        // If a model is provided, the texture above is ignored
        model: "terrain.js",
    },
    skybox: {
        scale: 50000,
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
            tags: [],
            id: "hero",
            model: "BoychoAnimation.js",
            weapon: "PistolAnimation.js",
            pos: [0, 100, 0],
            scale: 5,
        },
        {
            type: "character",
            tags: ["statue"],
            id: "sokolov",
            model: "SokolovAnimation.js",
            weapon: "PistolAnimation.js",
            pos: [-520, 0, 383],
            scale: 5,
        },
        {
            type: "character",
            tags: ["npc", "citizen"],
            id: "notsokolov",
            model: "BoychoAnimation.js",
            weapon: "PistolAnimation.js",
            pos: [10000, 0, 10000],
            scale: 5,
        },
    ],
    statics: [
        //{"type":"environment","pos":[0, 0, 0],"rot":[0,0.12540551203016742,0],"scale":3.564230587818792,"model":"objectHouse1.js","id":"","tags":[]},
        {"type":"environment","pos":[-507.68779988583515,-0.5615264784297338,1120.011477711489],"rot":[0,0,0],"scale":11.72180006665021,"model":"mill.js","id":"","tags":[]},
        {"type":"environment","pos":[-722.2879934368644,0,1184.0402781102712],"rot":[0,-0.8272822239913616,0],"scale":120.18314058477033,"model":"Restaurant_one.js","id":"","tags":[]},
    ]
}