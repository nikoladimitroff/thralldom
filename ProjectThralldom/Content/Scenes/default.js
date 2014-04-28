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
        gravity: -150,
    },
    // No more settings, scene definition
    terrain: {
        scale: 200,
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
            tags: ["skyrim"],
            id: "hero",
            model: "BoychoAnimation.js",
            weapon: "PistolAnimation.js",
            pos: [105, 50, 758],
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
        //{
        //    type: "character",
        //    tags: ["npc", "citizen"],
        //    id: "notsokolov",
        //    model: "BoychoAnimation.js",
        //    weapon: "PistolAnimation.js",
        //    pos: [10000, 0, 10000],
        //    scale: 5,
        //},
    ],
    statics: [
        {"type":"environment","pos":[600, 2.6, 840],"rot":[0,0.55,0],"scale":98.87,"model":"objectMarket.js","id":"","tags":[]},
        //{"type":"environment","pos":[-621.8750916173688,-0.5615264784297338,478.80638844396805],"rot":[0,0,0],"scale":11.72180006665021,"model":"mill.js","id":"","tags":[]},
        //{"type":"environment","pos":[-668.0406695538273,0,971.0066792178466],"rot":[0,-0.13843103394036205,0],"scale":11.078899851239674,"model":"mint.js","id":"","tags":[]},
        //{"type":"environment","pos":[-209.12103696643632,-0.5615264784297338,909.7834203660742],"rot":[3.141592653589793,-1.354531116807319,3.141592653589793],"scale":11.72180006665021,"model":"mill.js","id":"","tags":[]},
        //{"type":"environment","pos":[-200.0212467327136,0,220.85418046924735],"rot":[3.141592653589793,0.33953587029718374,3.141592653589793],"scale":3.564230587818792,"model":"objectHouse1.js","id":"","tags":[]},
        //{"type":"environment","pos":[-337.58022682234144,0,1119.753329358487],"rot":[3.141592653589793,-0.07040103504371831,3.141592653589793],"scale":118.53899408022427,"model":"Restaurant_two.js","id":"","tags":[]},
        //{"type":"environment","pos":[-579.0527390187193,0,299.50488671163913],"rot":[3.141592653589793,-0.6281816204036365,3.141592653589793],"scale":71.45636088101779,"model":"Workshop.js","id":"","tags":[]},
        //{"type":"environment","pos":[-360, 0, 606],"rot":[3.141592653589793,-0.6281816204036365,3.141592653589793],"scale":10,"model":"House_03.js","id":"","tags":[]},
        //{"type":"environment","pos":[-34.59414605586694,0,783.1715585160563],"rot":[0,0.12540551203016742,0],"scale":3.564230587818792,"model":"objectHouse1.js","id":"","tags":[]},
        //{"type":"environment","pos":[-507.68779988583515,-0.5615264784297338,1120.011477711489],"rot":[0,0,0],"scale":11.72180006665021,"model":"mill.js","id":"","tags":[]},
        //{"type":"environment","pos":[-722.2879934368644,0,1184.0402781102712],"rot":[0,-0.8272822239913616,0],"scale":120.18314058477033,"model":"Restaurant_one.js","id":"","tags":[]},
    ]
}