{
    name: "level1",
    settings: {
        debugDraw: true,
        cameraAngularSpeed: 10 * Math.PI,
        cameraMovementSpeed: 1 * 1e3,
    },
    physics: {
        friction: 1,
        restitution: 0,
        linearDamping: 0.5,
        angularDamping: 1,
        gravity: -9.8,
    },
    terrain: {
        scale: 2000,
        texture: "Grass.jpg",
        repeatTexture: true,
        // If a model is provided, the texture above is ignored
        model: "objectTerrain.js",
    },
    skybox: {
        scale: 2000,
        textures: [
                "Content/Textures/Skybox/posX.png", 
                "Content/Textures/Skybox/negX.png", 
                "Content/Textures/Skybox/posY.png", 
                "Content/Textures/Skybox/negY.png", 
                "Content/Textures/Skybox/posZ.png",
                "Content/Textures/Skybox/negZ.png", 
        ],
    },
    dynamics: [
        {
            type: "character",
            tags: [],
            id: "hero",
            model: "TestEight.js",
            pos: [0, 0, 0],
            scale: 5,
        },
        {
            type: "character",
            tags: ["npc"],
            id: "thisguy",
            model: "TestEight.js",
            pos: [30, 0, 0],
            scale: 5,
        },
    ],
    statics: [
        
        {"type":"environment", tags: ["building"],"pos":[-393.82,0,51.73],"rot":[0,0,0],"scale":3.5,"model":"house_one.js"},{"type":"environment", tags: ["building"],"pos":[-331.03553178261245,0,-195.20226269285726],"rot":[0,-1.5577188540185378,0],"scale":3.5,"model":"house_one.js"},
        {"type":"environment", tags: ["building"],"pos":[90.60330488167114,0,120.77182926800373],"rot":[3.141592653589793,0.03779037061426142,3.141592653589793],"scale":3.5,"model":"house_one.js"},
        {"type":"environment", tags: ["building"],"pos":[-258.4222199467363,0,208.32359567890623],"rot":[3.141592653589793,-1.568557492105053,3.141592653589793],"scale":3.5,"model":"house_one.js"},
        {"type":"environment", tags: ["building"],"pos":[300.4222199467363,0,208.32359567890623],"rot":[3.141592653589793,20,3.141592653589793],"scale":3.5,"model":"house_one.js"},
        {"type":"environment", tags: ["building"],"pos":[100,0,-130],"rot":[0,130,0],"scale":3.5,"model":"house_two.js"},
        {"type":"environment", tags: ["building"],"pos":[0,0,-250],"rot":[0,90,0],"scale":3.5,"model":"house_two.js"},
        {"type":"environment", tags: ["building"],"pos":[-140,0,-10],"rot":[0,40,0],"scale":3.5,"model":"house_two.js"},
        {"type":"environment", tags: ["building"],"pos":[300,0,100],"rot":[0,70,0],"scale":3.5,"model":"house_two.js"},
        
    ],
}