module Thralldom {
    export class ControllerManager {

        public controllers: Array<IController>;

        constructor() {
            this.controllers = new Array<AI.AIController>();
        }
         
        public update(delta: number, world: Thralldom.World) {
            for (var i = 0; i < this.controllers.length; i++) {
                this.controllers[i].update(delta, world);
            }
        }
    }
} 