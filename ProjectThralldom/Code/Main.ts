/// <reference path="application.ts" />

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

            if (!hasStarted) {
                app.requestPointerLockFullscreen(document.body);
                app.run();
                loadingScreen.style.display = "none";
                hasStarted = true;
            }
        };

        document.body.addEventListener("click", clickHandler, false);
    });

    progressNotifier.update = function (percentage, text) {
        progressBar.value = (percentage - 0.2)* 100;
        progressText.innerHTML = progressBar.value.toFixed(0) + "%" + "&nbsp;&nbsp;&nbsp;&nbsp" + text;
    };
});