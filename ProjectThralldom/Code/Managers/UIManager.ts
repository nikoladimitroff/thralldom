module Thralldom {
    export class UIManager {

        public hud: HTMLElement;
        public subtitles: HTMLElement;
        public pausedScreen: HTMLElement;
        public stats: Stats;
        public storylineContext: CanvasRenderingContext2D;
        public viewmodel: any;

        constructor() {
            this.hud = <HTMLElement> document.querySelector("nav#hud pre");
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

        private loadViewmodel(particleManager: ParticleManager,
            azure: AzureManager,
            keybindings: CharacterControllers.IKeybindings): void {

            this.viewmodel = new Viewmodel(azure, particleManager, keybindings);
            ko.applyBindings(this.viewmodel);
        }

        public hookUI(resumeCallback: Function,
            particleManager: ParticleManager,
            azure: AzureManager,
            keybindings: CharacterControllers.IKeybindings): void {

            this.loadViewmodel(particleManager, azure, keybindings);

            function swap(query1, query2) {
                UIManager.fadein(document.querySelector(query1));
                UIManager.fadeout(document.querySelector(query2));
            }

            for (var i = 0; i < this.viewmodel.settings.length; i++) {
                var id = this.viewmodel.settings[i].id;
                var button = document.querySelector("#main ul li:nth-child({0})".format(i + 1));
                button.addEventListener("click", swap.bind(undefined, "#{0}".format(id), "#main"), false);
            }
            var buttons = document.getElementsByClassName("main-menu-return");
            for (var i = 0; i < buttons.length; i++) {
                var clickHandler = swap.bind(undefined, "#main", "#" + buttons[i].parentNode.parentNode["id"]);
                buttons[i].addEventListener("click", clickHandler, false);
            }
            document.getElementById("resume-button").addEventListener("click", <any>resumeCallback, false);

            // Azure
            var azureEle: HTMLLIElement = <any>document.getElementById("azure");
            azureEle.onclick = () => {
                var updateCallback = this.viewmodel.setSettings.bind(this.viewmodel); 
                azure.login(updateCallback);
            }
        }

        public get isVisible(): boolean {
            return !this.hud.classList.contains("fadeout");
        }

        public toggleHud(showHud: boolean): void {
            if (showHud) {
                UIManager.fadein(this.hud);
                UIManager.fadein(this.stats.domElement);
            }
            else {
                UIManager.fadeout(this.hud);
                UIManager.fadeout(this.stats.domElement);
            }
        }

        public static fadein = function (elem) {
            elem.classList.remove("fadeout");
            elem.classList.add("fadein");
        }

        public static fadeout = function (elem) {
            elem.classList.remove("fadein");
            elem.classList.add("fadeout");
        }
    }
}