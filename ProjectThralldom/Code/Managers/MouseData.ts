module Thralldom {
    export class MouseData {
        public ndc: THREE.Vector2;
        public scroll: number;
        public leftButton: Boolean;
        public middleButton: Boolean;
        public rightButton: Boolean;

        constructor() {
            this.ndc = new THREE.Vector2();
            this.scroll = 0;
            this.leftButton = this.middleButton = this.rightButton = false;
        }

        public cloneFrom(data: MouseData): void {
            this.ndc.x = data.ndc.x;
            this.ndc.y = data.ndc.y;
            this.scroll = data.scroll;
            this.leftButton = data.leftButton;
            this.middleButton = data.middleButton;
            this.rightButton = data.rightButton;
        }

        public toString(): string {
            return Utilities.formatString("X: {0}, Y: {1}, Scroll: {2}, Left: {3}, Middle: {4}, Right: {5}",
                this.ndc.x.toFixed(3), this.ndc.y.toFixed(3), this.scroll, this.leftButton, this.middleButton, this.rightButton);
        }

    }
} 