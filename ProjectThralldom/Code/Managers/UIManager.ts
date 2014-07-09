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

        public hookupPausedControls(resumeCallback: Function,
            renderer: THREE.WebGLRenderer, scene: THREE.Scene,
            particleManager: ParticleManager,
            azure: AzureManager): void {
            function swap(query1, query2) {
                Storyteller.fadein(document.querySelector(query1));
                Storyteller.fadeout(document.querySelector(query2));
            }

            document.querySelector("#main ul li:nth-child(1)").addEventListener("click", swap.bind(undefined, "#graphics", "#main"), false);
            document.querySelector("#main ul li:nth-child(2)").addEventListener("click", swap.bind(undefined, "#audio", "#main"), false);

            var buttons = document.getElementsByClassName("main-menu-return");
            for (var i = 0; i < buttons.length; i++) {
                buttons[i].addEventListener("click", swap.bind(undefined, "#main", "#" + buttons[i].parentNode.parentNode["id"]), false);
            }

            document.getElementById("resume-button").addEventListener("click", <any>resumeCallback, false);

            // Sound
            var volume: HTMLInputElement = <any>document.getElementById("master-volume");
            volume.onchange = function () {
                AudioManager.instance.masterVolume = ~~volume.value / ~~volume.max;
                azure.save(particles.checked, ~~volume.value);
            }

            // Graphics
            var particles: HTMLInputElement = <any>document.getElementById("enable-particles");
            particles.onchange = function () {
                if (particles.checked) {
                    particleManager.load();
                }
                else {
                    particleManager.destroy();
                }
                azure.save(particles.checked, ~~volume.value);
            }

            // Azure
            var azureEle: HTMLLIElement = <any>document.getElementById("azure");
            azureEle.onclick = function () {
                azure.login();
            }

            //var viewDistance: HTMLInputElement = <any>document.getElementById("view-distance");
            //viewDistance.onchange = function () {
            //    var fog: THREE.Fog = <any>scene.fog;
            //    var percentage = ~~viewDistance.value / ~~viewDistance.max;
            //    fog.far = particleManager.terrainSize * percentage;
            //}


        }

        public get isVisible(): boolean {
            return !this.hud.classList.contains("fadeout");
        }

        public toggleHud(showHud: boolean): void {
            if (showHud) {
                Storyteller.fadein(this.hud);
                Storyteller.fadein(this.stats.domElement);
            }
            else {
                Storyteller.fadeout(this.hud);
                Storyteller.fadeout(this.stats.domElement);
            }
        }
    }
}