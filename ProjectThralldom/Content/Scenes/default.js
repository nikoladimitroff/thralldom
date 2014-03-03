{
    name: "level1",
    settings: {
        debugDraw: true,
        cameraAngularSpeed: 10 * Math.PI,
        cameraMovementSpeed: 2 * 1e+6,
    },
    physics: {
        friction: 1,
        restitution: 0,
        contactStiffness: 1e10,
        contactRegularizationTime: 3,
        frictionStiffness: 1e10,
        frictionRegularizationTime: 3,
        gravity: -20,
    },
    terrain: {
        size: 2000,
        texture: "Grass.jpg",
        repeatTexture: true,
    },
    skybox: {
        size: 2000,
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
            tags: [],
            id: "",
            model: "TestEight.js",
            pos: [30, 0, 0],
            scale: 5,
        },
    ],
    statics: [
        {"type":"environment","pos":[100,0,-130],"rot":[0,130,0],"scale":3.5,"model":"objectHouse1.js"},
        {"type":"environment","pos":[0,0,-250],"rot":[0,90,0],"scale":3.5,"model":"objectHouse1.js"},
        {"type":"environment","pos":[-140,0,-10],"rot":[0,40,0],"scale":3.5,"model":"objectHouse1.js"},
        {"type":"environment","pos":[300,0,100],"rot":[0,70,0],"scale":3.5,"model":"objectHouse1.js"},
        {"type":"environment","pos":[-30,0,200],"rot":[0,70,0],"scale":89.0,"model":"objectMarket.js"},
        {"type":"environment","pos":[0,0,0],"rot":[0,0,0],"scale":2500,"model":"objectTerrain.js"},
        {"type":"environment","pos":[0,0,50],"rot":[0,0,0],"scale":100,"model":"barrels_one.js"},
        {"type":"environment","pos":[0,0,0],"rot":[0,0,0],"scale":100,"model":"barrels_two.js"}
    ],
}