/// <reference path="application.ts" />
window.onload = function () {
    var app: Thralldom.Application = new Thralldom.Application(document.getElementById("webGL"), 1000 / 30);
    app.run();
};