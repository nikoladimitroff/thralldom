module Thralldom {
    export class MouseData {
        public coordinates: THREE.Vector2;
        public scroll: number;
        public leftButton: Boolean;
        public middleButton: Boolean;
        public rightButton: Boolean;

        constructor() {
            this.coordinates = new THREE.Vector2();
            this.scroll = 0;
            this.leftButton = this.middleButton = this.rightButton = false;
        }

        public cloneFrom(data: MouseData): void {
            this.coordinates.x = data.coordinates.x;
            this.coordinates.y = data.coordinates.y;
            this.scroll = data.scroll;
            this.leftButton = data.leftButton;
            this.middleButton = data.middleButton;
            this.rightButton = data.rightButton;
        }

        public toString(): string {
            return Utilities.formatString("X: {0}, Y: {1}, Scroll: {2}, Left: {3}, Middle: {4}, Right: {5}",
                this.coordinates.x, this.coordinates.y, this.scroll, this.leftButton, this.middleButton, this.rightButton);
        }

    }
} 