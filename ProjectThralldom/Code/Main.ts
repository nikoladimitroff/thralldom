/// <reference path="application.ts" />
$(function () {
    var app: Thralldom.Application = new Thralldom.Application(document.getElementById("webGL"));
    // Make the game visible for easier debuggin
    var w = <any> window;
    w.game = app;


    var loadingScreen: HTMLDivElement = <any>document.getElementById("loading-screen");
    var imageSources = ["winged.jpg", "levski.jpg", "shipka.jpg", "shipka2.jpg"];

    loadingScreen.style.backgroundImage = "url('Images/" + imageSources[~~(Math.random() * (imageSources.length - 1))] + "')";

    var progressBar: HTMLProgressElement = <any>document.getElementById("loading-bar");
    var progressText: HTMLSpanElement = <any>document.getElementById("loading-text");


    var progressNotifier = app.load((meta: Thralldom.IMetaGameData) => {
        progressText.innerHTML = "Press any key to continue";

        var hasStarted = false;
        var clickHandler = () => {
            app.requestPointerLockFullscreen(document.body);

            if (!hasStarted) {
                app.run(meta);
                loadingScreen.style.display = "none";
                hasStarted = true;
            }
        };

        document.body.addEventListener("click", clickHandler, false);
    });

    progressNotifier.update = function (percentage, text) {
        progressBar.value = percentage * 100;
        progressText.innerHTML = (percentage * 100).toFixed(0) + "%" + "&nbsp;&nbsp;&nbsp;&nbsp" + text;
    };
});