module Thralldom {
    export class UIManager {

        public text: HTMLElement;
        public subtitles: HTMLElement;
        public pausedScreen: HTMLElement;
        
        constructor() {
            this.text = <HTMLElement> document.querySelector("nav pre");
            this.subtitles = <HTMLElement> document.querySelector("#subtitles span");
            this.pausedScreen = <HTMLElement> document.querySelector("#paused-screen");
        }
    }
}