module Thralldom {
    export class Storyteller {
        private screens: Array<HTMLElement>;
        private visibleIndex: number;
        private context: CanvasRenderingContext2D;
        private text: Array<string>;
        private textIndex: number;
        private intervalId: number;

        private textColor: string;
        private textFont: string;

        private effects: Array<ParticleEngine2D>;

        public onDone: () => void;

        constructor(webglContainer: HTMLElement, context: CanvasRenderingContext2D, effects: Array<ParticleEngine2D>, text: Array<string>, 
            textFont: string = "3em Segoe UI",
            textColor: string = "white") {
            this.screens = [webglContainer, context.canvas];
            this.visibleIndex = 0;
            this.context = context;
            this.effects = effects;

            this.text = text;
            this.textIndex = 0;
            this.textColor = textColor;
            this.textFont = textFont;


            this.intervalId = -1;
        }

        public static fixProperties(webglContainer: HTMLElement, context: CanvasRenderingContext2D, effects: Array<ParticleEngine2D>): void {

            Thralldom.FixedStoryteller = Thralldom.Storyteller.bind(undefined, webglContainer, context, effects);
        }

        public static fadein = function (elem) {
            elem.classList.remove("fadeout");
            elem.classList.add("fadein");
        }

        public static fadeout = function (elem) {
            elem.classList.remove("fadein");
            elem.classList.add("fadeout");
        }

        private advance(): void {

            // If vis index is 0, webgl is still visible but will be soon faded away,
            if (this.visibleIndex == 0) {
                this.textIndex++;
            }

            var toFadeOut, toFadeIn;
            Storyteller.fadeout(this.screens[this.visibleIndex]);
            this.visibleIndex = (this.visibleIndex + 1) % this.screens.length;
            Storyteller.fadein(this.screens[this.visibleIndex]);


            if (this.textIndex >= this.text.length - 1 && this.visibleIndex == 0) {
                clearInterval(this.intervalId);
                this.intervalId = -1;

                if (this.onDone)
                    this.onDone();
            }
        }

        public play(interval: number, reset: boolean = false): void {
            if (this.intervalId != -1) {
                if (!reset) {
                    return;
                }
                clearInterval(this.intervalId);
            }

            for (var i = 0; i < this.effects.length; i++) {
                this.effects[i].generateParticles(this.context);    
            }

            this.visibleIndex = 0;
            this.textIndex = -1;

            // Advance once immediately, set up interval
            this.advance();
            this.intervalId = setInterval(this.advance.bind(this), interval);
            this.loop();
        }

        private loop(): void {
            this.update();
            this.draw();

            if (this.intervalId != -1)
                requestAnimationFrame(this.loop.bind(this));
        }

        private update(): void {
            for (var i = 0; i < this.effects.length; i++) {
                this.effects[i].update();
            }
        }

        private draw(): void {
            
            // Handle resizing
            var actualStyle = window.getComputedStyle(this.context.canvas);
            this.context.canvas.width = ~~actualStyle.width.replace("px", "");
            this.context.canvas.height = ~~actualStyle.height.replace("px", "");

            if (this.text[this.textIndex]) {

                this.context.fillStyle = this.textColor;
                this.context.font = this.textFont;

                var textWidth = this.context.measureText(this.text[this.textIndex]);

                var x = (this.context.canvas.width - textWidth.width) / 2,
                    y = this.context.canvas.height / 2;

                this.context.fillText(this.text[this.textIndex], x, y);
            }

            for (var i = 0; i < this.effects.length; i++) {
                this.effects[i].draw();
            }
        }
    }

    // This class is here only for declaration purposes. It's created on Storyteller.fixDomElements
    export declare class FixedStoryteller extends Storyteller {
        constructor(text: Array<string>, textFont?: string, textColor?: string);
    }
} 