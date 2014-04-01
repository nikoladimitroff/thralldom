/// <reference path="application.ts" />
$(function () {
    var app: Thralldom.Application = new Thralldom.Application(document.getElementById("webGL"));

    var playButton = document.getElementById("play-button");
    playButton.disabled = true;

    var loadingScreen: HTMLDivElement = <any>document.getElementById("loading-screen");
    var imageSources = ["winged.jpg", "levski.jpg", "shipka.jpg", "shipka2.jpg"];

    loadingScreen.style.backgroundImage = "url('Images/" + imageSources[~~(Math.random() * (imageSources.length - 1))] + "')";

    var progressBar: HTMLProgressElement = <any>document.getElementById("loading-bar");
    var progressText: HTMLSpanElement = <any>document.getElementById("loading-text");

    var progressNotifier = app.load((meta: Thralldom.IMetaGameData) => {
        playButton.disabled = false;
        playButton.addEventListener("click", () => {
            loadingScreen.style.display = "none";
            app.requestPointerLockFullscreen(document.body);
            app.run(meta);
        });
    });

    progressNotifier.update = function (percentage, text) {
        progressBar.value = percentage * 100;
        progressText.innerHTML = (percentage * 100).toFixed(0) + "%" + "&nbsp;&nbsp;&nbsp;&nbsp" + text;
    };


});