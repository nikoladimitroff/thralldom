{
    // Settings below for various things
    settings: {
        attachDebuggingVisuals: true,
    },
    controller: {
        angularSpeed: 10 * Math.PI,
    },
    character: {
        mass: 70,
        jumpImpulse: 15,
        viewAngle: Math.PI / 3,
        movementSpeed: 1 * 1e3,
        sprintMultiplier: 2,
    },
    physics: {
        friction: 1,
        restitution: 0,
        linearDamping: 0.7,
        angularDamping: 1,
        gravity: -150.8,
    },
    // No more settings, scene definition
    terrain: {
        scale: 500,
        texture: "Grass.jpg",
        repeatTexture: true,
        // If a model is provided, the texture above is ignored
        model: "terrain.js",
    },
    skybox: {
        scale: 10000,
        textures: [
                "Content/Textures/Skybox/posX.png", 
                "Content/Textures/Skybox/negX.png", 
                "Content/Textures/Skybox/posY.png", 
                "Content/Textures/Skybox/negY.png", 
                "Content/Textures/Skybox/posZ.png",
                "Content/Textures/Skybox/negZ.png", 
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
            pos: [0, 300, 0],
            scale: 5,
        },
        {
            type: "character",
            tags: ["guard", "npc"],
            id: "sokolov",
            model: "BoychoAnimation.js",
            weapon: "PistolAnimation.js",
            pos: [20, 300, 20],
            scale: 5,
        },
    ],
    statics: [{"type":"environment","pos":[1983.19,524.76,2582.04],"rot":[0,-0.87,0],"scale":40,"model":"Tavern.js","id":"","tags":[]},{"type":"environment","pos":[2404.01,524.76,1943.6599127822246],"rot":[0,0.59,0],"scale":40,"model":"Tavern.js","id":"","tags":[]},{"type":"environment","pos":[3240.7701879972246,524.76,2075.073017574295],"rot":[0,0.59,0],"scale":40,"model":"Tavern.js","id":"","tags":[]},{"type":"environment","pos":[2690.803829954837,524.76,1727.5702885890223],"rot":[3.14,-0.58,3.14],"scale":40,"model":"Tavern.js","id":"","tags":[]},{"type":"environment","pos":[3075.587242679461,524.76,1339.5533435931925],"rot":[3.14,-1.06,3.14],"scale":40,"model":"Tavern.js","id":"","tags":[]},{"type":"environment","pos":[3356.843954751256,524.76,1799.0615411152476],"rot":[3.14,-1.059999999999994,3.14],"scale":40,"model":"Tavern.js","id":"","tags":[]},{"type":"environment","pos":[3984.184731387965,521.24,1322.1169711262219],"rot":[3.14,-3.34,3.14],"scale":40,"model":"Tavern.js","id":"","tags":[]},{"type":"environment","pos":[3836.514830845353,521.24,2190.8765654100685],"rot":[0,-1.2,0],"scale":40,"model":"Tavern.js","id":"","tags":[]},{"type":"environment","pos":[2639.7541518319294,524.76,1281.8619179039358],"rot":[3.14,3.04,3.14],"scale":40,"model":"Tavern.js","id":"","tags":[]},{"type":"environment","pos":[2088.5483364495735,524.76,1506.5735999567923],"rot":[0,0.59,0],"scale":40,"model":"Tavern.js","id":"","tags":[]},{"type":"environment","pos":[1736.374587054076,524.76,1872.6622372397371],"rot":[0,0.59,0],"scale":40,"model":"Tavern.js","id":"","tags":[]},{"type":"environment","pos":[1514.8231688936837,524.76,2410.2316634841045],"rot":[0,0.59,0],"scale":40,"model":"Tavern.js","id":"","tags":[]},{"type":"environment","pos":[1462.9922092264503,524.76,3121.715625200346],"rot":[0,-2.05,0],"scale":40,"model":"Tavern.js","id":"","tags":[]},{"type":"environment","pos":[2563.0082640298515,496.23467393301974,2500.7722985773457],"rot":[0,0.59,0],"scale":40,"model":"Tavern.js","id":"","tags":[]},{"type":"environment","pos":[2247.6886400474637,524.76,2925.7810906400623],"rot":[0,0.59,0],"scale":40,"model":"Tavern.js","id":"","tags":[]},{"type":"environment","pos":[2247.6886400474637,524.76,3658.469659966165],"rot":[0,0.59,0],"scale":40,"model":"Tavern.js","id":"","tags":[]},{"type":"environment","pos":[2771.6363869259503,524.76,3206.652355340353],"rot":[3.141592653589793,1.4302528615391281,3.141592653589793],"scale":40,"model":"Tavern.js","id":"","tags":[]},{"type":"environment","pos":[1690.805940322538,524.76,3868.365212319311],"rot":[0,0.59,0],"scale":40,"model":"Tavern.js","id":"","tags":[]},{"type":"environment","pos":[3077.7943796638588,524.76,3862.5017108953116],"rot":[0,0.59,0],"scale":40,"model":"Tavern.js","id":"","tags":[]},{"type":"environment","pos":[3405.8591500952148,489.8754934245858,3012.816965703401],"rot":[3.141592653589793,0.972360948409117,3.141592653589793],"scale":40,"model":"Tavern.js","id":"","tags":[]},{"type":"environment","pos":[4380.084269859089,513.1269819259694,672.286071013857],"rot":[0,1.5,0],"scale":300,"model":"oldwarehouse.js","id":"","tags":[]}],
}