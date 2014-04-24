// Inspired / stolen from http://jsfiddle.net/jonnyc/Ujz4P/5/
module Thralldom {
    export class ParticleEngine2D {
        // Create an array to store our particles
        private particles: Array<Particle2D>;
        private particleCount: number;
        private maxVelocity: number;

        private minX: number;
        private maxX: number;
        private minY: number;
        private maxY: number;

        private context: CanvasRenderingContext2D

        // Create an image object (only need one instance)
        private imageObj: HTMLImageElement;
        constructor(context: CanvasRenderingContext2D, imgSrc: string, particleCount: number, maxVelocity: number,
                    minX: number, maxX: number, minY, maxY: number) {

            this.context = context;
            this.particleCount = particleCount;
            this.maxVelocity = maxVelocity;
            this.particles = new Array<Particle2D>();

            this.minX = minX;
            this.maxX = maxX;
            this.minY = minY;
            this.maxY = maxY;

            this.imageObj = new Image();
            // Once the image has been downloaded then set the image on all of the particles
            this.imageObj.onload = () => {
                this.particles.forEach((particle) => {
                    particle.setImage(this.imageObj);
                });
            };
            this.imageObj.src = imgSrc;
            this.generateParticles(context);
        }

        public generateParticles(context: CanvasRenderingContext2D): void {
            // Create the particles and set their initial positions and velocities
            for (var i = 0; i < this.particleCount; ++i) {
                var particle = new Particle2D();

                // Set the position to be inside the canvas bounds
                particle.setPosition(ParticleEngine2D.generateRandom(0, context.canvas.width),
                    ParticleEngine2D.generateRandom(0, context.canvas.height));

                // Set the initial velocity to be either random and either negative or positive
                particle.setVelocity(ParticleEngine2D.generateRandom(-this.maxVelocity, this.maxVelocity),
                    ParticleEngine2D.generateRandom(-this.maxVelocity, this.maxVelocity));
                this.particles.push(particle);
            }
        }
      
        // A function to generate a random number between 2 values
        public static generateRandom(min, max) {
            return Math.random() * (max - min) + min;
        }

        // The function to draw the scene
        public draw(): void {
            // Clear the drawing surface and fill it with a black background
            this.context.fillStyle = "rgba(0, 0, 0, 0.5)";
            this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);

            // Go through all of the particles and draw them.
            for (var i = 0; i < this.particleCount; i++) {
                this.particles[i].draw(this.context);
            }
        }

        // Update the scene
        public update(): void {
            for (var i = 0; i < this.particleCount; i++) {
                this.particles[i].update(this.minX, this.maxX, this.minY, this.maxY, this.context.canvas.width, this.context.canvas.height);
            }
        }
    }
}