{
    skinned: [
        {
            path: "Content/Models/Heroes/Boycho/BoychoAnimation.js",
            animationData: true,
        },
        {
            path: "Content/Models/Heroes/Boycho/PistolAnimation.js",
            animationData: false,
        }
    ],
    models: [
        "Content/Models/Terrain/terrain.js",
        "Content/Models/Buildings/House_01/objectHouse1.js",
        "Content/Models/Buildings/House_02/objectMarket.js",
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
            volume: 1,
        },
        {
            sound: "Sprinting",
            path: "Content/Sounds/running.mp3",
            volume: 1,
        },
        {
            sound: "Shooting",
            path: "Content/Sounds/gunshot.mp3",
            volume: 1,
        },
        {
            sound: "Soundtrack",
            path: "Content/Sounds/forest_background.mp3",
            // Set background music to low level, else nothing else can't be heard
            volume: 0.1,
        },
    ],
    subtitles: [
        "Content/Subtitles/Liars.srt",
    ]
}