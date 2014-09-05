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
            mass: 140,
            jumpImpulse: 200,
            viewAngle: Math.PI / 3,
            movementSpeed: 5 * 1e4,
            sprintMultiplier: 2,
            },
        ".guard": {
                movementSpeed: 2 * 1e3,
                },
    },
    physics: {
            friction: 1,
            restitution: 0,
            linearDamping: 0.7,
            angularDamping: 1,
            gravity: -50,
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
    skybox: {
        scale: 29000,
        textures: [
                "Content/Textures/Skyboxes/Night/posX.png", 
                "Content/Textures/Skyboxes/Night/negX.png", 
                "Content/Textures/Skyboxes/Night/posY.png", 
                "Content/Textures/Skyboxes/Night/negY.png", 
                "Content/Textures/Skyboxes/Night/posZ.png",
                "Content/Textures/Skyboxes/Night/negZ.png", 
        ],
    },
    terrain: {"scale":200,"model":"terrain.js"},
    dynamics: [
        {
            "type":"character",
            "pos":[-2653.948,500.341,-2238.005],"rot":[0,0,0],"scale":15.512,
            "model":"BoychoAnimation.js",
            "id":"hero","tags":["skyrim"],
            "weapon": "PistolAnimation.js",
            "interaction":""},
    ],
    statics: [{"type":"environment","pos":[835.209,0,2131.988],"rot":[0,-0.08,0],"scale":28.823,"model":"House_03.js","id":"","tags":[],"interaction":""},{"type":"environment","pos":[1646.512,0.664,907.848],"rot":[3.14,0.96,3.14],"scale":29.968,"model":"Tavern.js","id":"","tags":[],"interaction":""},{"type":"environment","pos":[2437.711,0,-371.516],"rot":[3.142,0.616,3.142],"scale":338.275,"model":"Workshop.js","id":"","tags":[],"interaction":""},{"type":"environment","pos":[-68.998,0,1630.515],"rot":[0,0.793,0],"scale":39.429,"model":"Restaurant_one.js","id":"","tags":[],"interaction":""},{"type":"environment","pos":[1017.333,0,699.245],"rot":[0,-1.207,0],"scale":32.388,"model":"market.js","id":"","tags":[],"interaction":""},{"type":"environment","pos":[19.268,0,1106.744],"rot":[-3.142,-0.803,-3.142],"scale":274.794,"model":"Restaurant_two.js","id":"","tags":[],"interaction":""},{"type":"environment","pos":[1864.193,0,-2183],"rot":[0,0.334,0],"scale":124.77,"model":"oldhouse.js","id":"","tags":[],"interaction":""},{"type":"environment","pos":[1485.801,0,1992.483],"rot":[-3.142,-0.797,-3.142],"scale":10.861,"model":"House_01.js","id":"","tags":[],"interaction":""},{"type":"environment","pos":[1613.947,0,2444.135],"rot":[-3.142,-0.408,-3.142],"scale":35.248,"model":"well.js","id":"","tags":[],"interaction":""},{"type":"environment","pos":[1735.042,16.572,2102.67],"rot":[0,0.16,0],"scale":91.172,"model":"Barrels_One.js","id":"","tags":[],"interaction":""},{"type":"environment","pos":[-254.332,0,1521.79],"rot":[0,-0.761,0],"scale":57.833,"model":"Barrels_Two.js","id":"","tags":[],"interaction":""},{"type":"environment","pos":[-276.004,0,1589.063],"rot":[0,0.127,0],"scale":52.261,"model":"Barrels_Three.js","id":"","tags":[],"interaction":""},{"type":"environment","pos":[1098.375,0,912.177],"rot":[3.142,0.542,3.142],"scale":58.434,"model":"cart.js","id":"","tags":[],"interaction":""},{"type":"environment","pos":[656.242,0,96.369],"rot":[0,-0.819,0],"scale":40.73,"model":"smallmarket.js","id":"","tags":[],"interaction":""},{"type":"environment","pos":[754.09,0,1336.05],"rot":[3.142,-1.524,3.142],"scale":46.64,"model":"mint.js","id":"","tags":[],"interaction":""},{"type":"environment","pos":[-1800.643,0,598.935],"rot":[0,1.428,0],"scale":40.07,"model":"mill.js","id":"","tags":[],"interaction":""},{"type":"environment","pos":[903.968,0,-193.806],"rot":[3.142,1.043,3.142],"scale":32.388,"model":"market.js","id":"","tags":[],"interaction":""},{"type":"environment","pos":[2410.586,0,1948.092],"rot":[3.142,-0.59,3.142],"scale":66.49,"model":"Konak.js","id":"konak","tags":[],"interaction":{ type: "item", itemCode: 0x1, quantity: 1 }},{"type":"environment","pos":[-2252.869,-21.87,-1493.178],"rot":[0,-0.621,0],"scale":95.613,"model":"rock_big.js","id":"","tags":[],"interaction":""},{"type":"environment","pos":[-1733.228,0,-1636.222],"rot":[0,-0.925,0],"scale":152.664,"model":"rock_medium.js","id":"","tags":[],"interaction":""},{"type":"environment","pos":[2610.626,0,-13.89],"rot":[0,-0.925,0],"scale":26.598,"model":"rock_medium.js","id":"","tags":[],"interaction":""},{"type":"environment","pos":[2511.307,0,-61.314],"rot":[0,-0.925,0],"scale":26.598,"model":"rock_medium.js","id":"","tags":[],"interaction":""}],
    navmesh: {"nodes":[],"edges":[]},
}