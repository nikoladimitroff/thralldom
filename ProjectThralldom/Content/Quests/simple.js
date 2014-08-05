[
    {
        name: "Main quest",
        objectives: [
            {
                type: "reach",
                target: "#sokolov",
                radius: 5,
                text: "Go touch him.",
                group: 0,
            },
            {
                type: "kill",
                target: ".guard",
                text: "Kill some mofos.",
                group: 0,
            },
        ]
    },
    {
        name: "A side quest",
        objectives: [
            {
                type: "gather",
                itemCode: 0x01,
                requiredItems: 5,
                text: "Gather 5 carrots.",
                group: 0,
            },
        ]
    },
]