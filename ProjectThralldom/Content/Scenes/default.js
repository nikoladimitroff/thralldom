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
            jumpImpulse: 15,
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
        gravity: -150.8,
    },
    // No more settings, scene definition
    terrain: {
        scale: 92.4,
        texture: "Grass.jpg",
        repeatTexture: true,
        // If a model is provided, the texture above is ignored
        model: "terrain.js",
    },
    skybox: {
        scale: 50000,
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
            pos: [-100, 20, 380],
            scale: 5,
        },
        {
            type: "character",
            tags: ["guard", "npc"],
            id: "sokolov",
            model: "BoychoAnimation.js",
            weapon: "PistolAnimation.js",
            pos: [20, 5, 20],
            scale: 5,
        },
    ],
    statics: [
        
        {"type":"environment","pos":[-499.36118663701524,-3.03,1002.866343618475],"rot":[0,0,0],"scale":10,"model":"House_03.js","id":"","tags":[]},
{"type":"environment","pos":[-874.2047923599092,-0.5482725134491631,907.0282744310715],"rot":[0,-1.5405075323130997,0],"scale":30.168218955010243,"model":"oldhouse.js","id":"","tags":[]},
{"type":"environment","pos":[-317.8850376928631,0,750.4275245745013],"rot":[0,0,0],"scale":7.240951452110968,"model":"cart.js","id":"","tags":[]},
{"type":"environment","pos":[-675.004861465046,0,847.888472196541],"rot":[0,0.12540551203016742,0],"scale":3.564230587818792,"model":"objectHouse1.js","id":"","tags":[]},
{"type":"environment","pos":[-680.79,-2.6,701.1],"rot":[0,0.55,0],"scale":98.87,"model":"objectMarket.js","id":"","tags":[]},
{"type":"environment","pos":[-621.8750916173688,-0.5615264784297338,478.80638844396805],"rot":[0,0,0],"scale":11.72180006665021,"model":"mill.js","id":"","tags":[]},
{"type":"environment","pos":[-668.0406695538273,0,971.0066792178466],"rot":[0,-0.13843103394036205,0],"scale":11.078899851239674,"model":"mint.js","id":"","tags":[]},
{"type":"environment","pos":[-748.3640823800667,-0.32177215617352317,301.6510425949386],"rot":[3.141592653589793,-1.5616459608638962,3.141592653589793],"scale":101.47625308459455,"model":"oldwarehouse.js","id":"","tags":[]},
{"type":"environment","pos":[-320.0271046685206,-0.38260673455624605,171.92344740962196],"rot":[0,0,0],"scale":8.173590871531877,"model":"Tavern.js","id":"","tags":[]},
{"type":"environment","pos":[-501.39367043514966,5.562726983548869,754.6777829376044],"rot":[0.0565761459287071,0.0027666415229329515,0.04881015303318911],"scale":5.312775049085797,"model":"well.js","id":"","tags":[]},
{"type":"environment","pos":[-341.38778976318724,-1.0281104120800322,410.71763140637165],"rot":[0,1.541380287786298,0],"scale":153.0417809415259,"model":"monastery_object.js","id":"","tags":[]},
{"type":"environment","pos":[-463.7796303384783,0,852.7237010055632],"rot":[0,0,0],"scale":9.339164622860842,"model":"Small_Market.js","id":"","tags":[]},
{"type":"environment","pos":[-438.5806228089106,-0.13851000511440148,745.2685763555576],"rot":[0,0,0],"scale":85.06475050863251,"model":"barrels_one.js","id":"","tags":[]},
{"type":"environment","pos":[-421.905575261976,-0.09851415580319199,752.2291030085329],"rot":[0,0,0],"scale":99.38101136694458,"model":"barrels_two.js","id":"","tags":[]},
{"type":"environment","pos":[-306.8887808319379,0,629.6695457031486],"rot":[0,0.5436502681181353,0],"scale":120.18314058477033,"model":"Restaurant_one.js","id":"","tags":[]},
{"type":"environment","pos":[-507.33905719388895,0,627.06353721843],"rot":[0,0,0],"scale":118.53899408022427,"model":"Restaurant_two.js","id":"","tags":[]},
{"type":"environment","pos":[-336.57503529924765,0,988.385833120407],"rot":[0,0,0],"scale":71.45636088101779,"model":"Workshop.js","id":"","tags":[]},
{"type":"environment","pos":[-348.0602126606045,4.375322382842331,766.842941397938],"rot":[1.6291280418705607,1.5006035037149623,-1.572426350362232],"scale":5.312775049085797,"model":"well.js","id":"","tags":[]},
{"type":"environment","pos":[-535.2550828294554,0.004391280111165408,810.5869810248295],"rot":[0,-1.2134384718869748,0],"scale":7.240951452110968,"model":"cart.js","id":"","tags":[]},
{"type":"environment","pos":[-119.34890918135702,-3.03,391.11922517857755],"rot":[0,1.5379387318731568,0],"scale":10,"model":"House_03.js","id":"","tags":[]},
{"type":"environment","pos":[-209.12103696643632,-0.5615264784297338,909.7834203660742],"rot":[3.141592653589793,-1.354531116807319,3.141592653589793],"scale":11.72180006665021,"model":"mill.js","id":"","tags":[]},
{"type":"environment","pos":[-145.0212467327136,0,197.85418046924735],"rot":[3.141592653589793,0.33953587029718374,3.141592653589793],"scale":3.564230587818792,"model":"objectHouse1.js","id":"","tags":[]},
{"type":"environment","pos":[-185.00765167605073,-0.38260673455624605,711.7216856952007],"rot":[0,-1.5256567596977082,0],"scale":8.173590871531877,"model":"Tavern.js","id":"","tags":[]},
{"type":"environment","pos":[-337.58022682234144,0,1119.753329358487],"rot":[3.141592653589793,-0.07040103504371831,3.141592653589793],"scale":118.53899408022427,"model":"Restaurant_two.js","id":"","tags":[]},
{"type":"environment","pos":[-441.27909841312317,0,192.09892078356268],"rot":[3.141592653589793,-0.749621667084872,3.141592653589793],"scale":11.078899851239674,"model":"mint.js","id":"","tags":[]},
{"type":"environment","pos":[-259.19438726982514,5.393231213434365,345.6213045949451],"rot":[1.635949415769101,1.5572636401012065,-1.579244483855352],"scale":5.312775049085797,"model":"well.js","id":"","tags":[]},
{"type":"environment","pos":[-579.0527390187193,0,299.50488671163913],"rot":[3.141592653589793,-0.6281816204036365,3.141592653589793],"scale":71.45636088101779,"model":"Workshop.js","id":"","tags":[]},
{"type":"environment","pos":[-27.177941365382868,-0.5482725134491631,549.7667509431469],"rot":[3.141592653589793,-1.4872849841238627,3.141592653589793],"scale":30.168218955010243,"model":"oldhouse.js","id":"","tags":[]},
{"type":"environment","pos":[-356.1223100896799,0,299.48579535356566],"rot":[3.141592653589793,-0.06034734365127648,3.141592653589793],"scale":9.339164622860842,"model":"Small_Market.js","id":"","tags":[]},
{"type":"environment","pos":[-34.59414605586694,0,783.1715585160563],"rot":[0,0.12540551203016742,0],"scale":3.564230587818792,"model":"objectHouse1.js","id":"","tags":[]},
{"type":"environment","pos":[-266.66416527881995,0,38.19123065730887],"rot":[0,-0.6493884237567897,0],"scale":118.53899408022427,"model":"Restaurant_two.js","id":"","tags":[]},
{"type":"environment","pos":[-818.1691555015373,0,694.5699324737058],"rot":[0,-0.8272822239913616,0],"scale":120.18314058477033,"model":"Restaurant_one.js","id":"","tags":[]},
{"type":"environment","pos":[1.9057764669072075,-3.03,916.1923602882276],"rot":[3.141592653589793,-1.2411753702364565,3.141592653589793],"scale":10,"model":"House_03.js","id":"","tags":[]},
{"type":"environment","pos":[-156.50614377458976,-0.32177215617352317,1098.0244786124795],"rot":[-3.141592653589793,-0.4753376695133587,-3.141592653589793],"scale":101.47625308459455,"model":"oldwarehouse.js","id":"","tags":[]},
{"type":"environment","pos":[-507.68779988583515,-0.5615264784297338,1120.011477711489],"rot":[0,0,0],"scale":11.72180006665021,"model":"mill.js","id":"","tags":[]},
{"type":"environment","pos":[-722.2879934368644,0,1184.0402781102712],"rot":[0,-0.8272822239913616,0],"scale":120.18314058477033,"model":"Restaurant_one.js","id":"","tags":[]},
{"type":"environment","pos":[-830.3811328655567,-0.38260673455624605,1068.986014305775],"rot":[0,-1.5256567596977082,0],"scale":8.173590871531877,"model":"Tavern.js","id":"","tags":[]},
     
    ]

}