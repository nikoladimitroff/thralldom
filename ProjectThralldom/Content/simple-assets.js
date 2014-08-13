{
    skinned: [
        {
            path: "Content/Models/Heroes/Boycho/BoychoAnimation.js",
            animationData: true,
        },
        {
            path: "Content/Models/Heroes/Boycho/PistolAnimation.js",
            animationData: false,
        },
        {
            path: "Content/Models/Heroes/Sokolov/SokolovAnimation.js",
            animationData: true,
        }
    ],
    models: [
        "Content/Models/Terrain/terrain.js",
        "Content/Models/Buildings/Houses/House_03.js",
        "Content/Models/Buildings/Houses/Tavern.js",
        "Content/Models/Buildings/Houses/Restaurant_two.js",
    ],
    textures: [
        "Content/Textures/Grass.jpg",
        "Content/Textures/BlackWhiteChecker.jpg",
        "Content/Textures/RedChecker.png",
    ],
    audio: [
        {
            sound: "Walking",
            path: "Content/Sounds/footsteps.mp3",
            volume: 0.1,
        },
        {
            sound: "Sprinting",
            path: "Content/Sounds/running.mp3",
            volume: 0.5,
        },
        {
            sound: "PistolShoot",
            path: "Content/Sounds/gunshot.mp3",
            volume: 1,
        },
        {
            sound: "Soundtrack",
            path: "Content/Sounds/forest_background.mp3",
            // Set background music to low level, else nothing else can't be heard
            volume: 0.1,
        },
        {
            sound: "Crickets",
            path: "Content/Sounds/crickets.mp3",
            // Set background music to low level, else nothing else can be heard
            volume: 0.01,
        },
    ],
    subtitles: [
    ]
}