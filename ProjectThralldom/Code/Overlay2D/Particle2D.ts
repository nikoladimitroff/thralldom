module Thralldom {
    export class Particle2D {

        public x: number;
        public y: number;
        public xVelocity: number;
        public yVelocity: number;
        public radius: number;
        public image: HTMLImageElement;

        constructor() {
            this.x = this.y = this.xVelocity = this.yVelocity = 0;
            this.radius = 5;
        }

        // The function to draw the particle on the canvas.
        public draw(context: CanvasRenderingContext2D): void {

            // If an image is set draw it
            if (this.image) {
                context.drawImage(this.image, this.x - this.image.width / 2, this.y - this.image.height / 2);
                // If the image is being rendered do not draw the circle so break out of the draw function                
                return;
            }
            // Draw the circle as before, with the addition of using the position and the radius from this object.
            context.beginPath();
            context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
            context.fillStyle = "rgba(0, 255, 255, 1)";
            context.fill();
            context.closePath();
        }

        // Update the particle.
        public update(minX: number, maxX: number, minY: number, maxY: number, canvasW: number, canvasH: number): void {
            // Update the position of the particle with the addition of the velocity.
            this.x += this.xVelocity;
            this.y += this.yVelocity;

            // Check if has crossed the right edge
            if (this.x / canvasW >= maxX) {
                this.xVelocity = -this.xVelocity;
                this.x = maxX * canvasW;
            }
            // Check if has crossed the left edge
            else if (this.x / canvasW <= minX) {
                this.xVelocity = -this.xVelocity;
                this.x = minX * canvasW;
            }

            // Check if has crossed the bottom edge
            if (this.y / canvasH >= maxY) {
                this.yVelocity = -this.yVelocity;
                this.y = maxY * canvasH;
            }

            // Check if has crossed the top edge
            else if (this.y / canvasH <= minY) {
                this.yVelocity = -this.yVelocity;
                this.y = minY * canvasH;
            }
        }

        // A function to set the position of the particle.
        public setPosition(x: number, y: number): void {
            this.x = x;
            this.y = y;
        }

        // Function to set the velocity.
        public setVelocity(x: number, y: number): void {
            this.xVelocity = x;
            this.yVelocity = y;
        }

        public setImage(image: HTMLImageElement): void {
            this.image = image;
        }
    }
} 