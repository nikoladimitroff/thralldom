module Thralldom {
    export class UIManager {

        public hud: HTMLElement;
        public subtitles: HTMLElement;
        public pausedScreen: HTMLElement;
        public stats: Stats;
        public storylineContext: CanvasRenderingContext2D;

        constructor() {
            this.hud = <HTMLElement> document.querySelector("nav pre");
            this.subtitles = <HTMLElement> document.querySelector("#subtitles span");
            this.pausedScreen = <HTMLElement> document.querySelector("#paused-screen");
            this.storylineContext = (<any>document.getElementById("storyline-canvas")).getContext("2d");

            this.stats = new Stats();
            this.stats.setMode(StatsModes.Fps);
            this.stats.domElement.style.position = 'absolute';
            this.stats.domElement.style.left = '0px';
            this.stats.domElement.style.bottom = '0px';
            document.body.appendChild(this.stats.domElement);
        }

        public get isVisible(): boolean {
            return !this.hud.classList.contains("fadeout");
        }

        public toggleHud(showHud: boolean): void {
            var classToAdd = "",
                classToRemove = "";
            if (showHud) {
                classToAdd = "fadein";
                classToRemove = "fadeout"
            }
            else {
                classToAdd = "fadeout";
                classToRemove = "fadein";
            }

            this.hud.classList.remove(classToRemove);
            this.stats.domElement.classList.remove(classToRemove);

            this.hud.classList.add(classToAdd);
            this.stats.domElement.classList.add(classToAdd);
        }
    }
}