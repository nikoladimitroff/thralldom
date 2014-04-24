/// <reference path="application.ts" />
function tellIntroStory(webglContainer: HTMLElement): void {

    var context: CanvasRenderingContext2D = (<any>document.getElementById("storyline-canvas")).getContext("2d");
    var imageSource = "Images/Overlay2D/smoke.png";

    var text = [
        "FIRST",
        "SECOND",
        "THIRD",
        "FORTH"
    ];

    var bias = 0;
    var engine = new Thralldom.ParticleEngine2D(context, imageSource, 40, 1, 0, 1, 0.45, 0.55);
    var w = <any> window;
    var font = "3em Segoe UI";
    w.storyteller = new Thralldom.Storyteller(webglContainer, context, text, [engine], font);

    w.storyteller.play(5000);
}

$(function () {
    var webglContainer = document.getElementById("webGL");
    var app: Thralldom.Application = new Thralldom.Application(webglContainer);
    // Make the game visible for easier debuggin
    var w = <any> window;
    w.game = app;


    var loadingScreen: HTMLDivElement = <any>document.getElementById("loading-screen");
    var imageSources = ["loading-screen.jpg"];//["winged.jpg", "levski.jpg", "shipka.jpg", "shipka2.jpg"];

    loadingScreen.style.backgroundImage = "url('Images/" + imageSources[~~(Math.random() * (imageSources.length - 1))] + "')";

    var progressBar: HTMLProgressElement = <any>document.getElementById("loading-bar");
    var progressText: HTMLSpanElement = <any>document.getElementById("loading-text");


    var hasStarted = false;
    var progressNotifier = app.load((meta: Thralldom.IMetaGameData) => {
        if (!hasStarted) {
            app.init(meta);
        }

        progressNotifier.update(1.2, "");
        progressText.innerHTML = "Click to continue";

        var clickHandler = () => {
            app.requestPointerLockFullscreen(document.body);

            if (!hasStarted) {
                app.run();
                loadingScreen.style.display = "none";
                hasStarted = true;
                tellIntroStory(webglContainer);
            }
        };

        document.body.addEventListener("click", clickHandler, false);
    });

    progressNotifier.update = function (percentage, text) {
        progressBar.value = (percentage - 0.2)* 100;
        progressText.innerHTML = progressBar.value.toFixed(0) + "%" + "&nbsp;&nbsp;&nbsp;&nbsp" + text;
    };
});