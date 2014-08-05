 module Thralldom {
     export class ScriptManager {

        private scripts: Array<ScriptedEvent>;
        private world: World;
        private hero: Character;
        private cameraController: CameraControllers.ICameraController;
        public active: ScriptedEvent;

        constructor(scripts: Array<ScriptedEvent>, hero: Character, world: World) {
            this.scripts = scripts;
            this.hero = hero;
            this.world = world;
        }

        private triggerScriptedEvents(): void {
            if (this.active) {
                if (this.active.finished) {
                    this.active.disable(this.world);

                    var index = this.scripts.indexOf(this.active);
                    this.scripts[index] = this.scripts[this.scripts.length - 1];
                    this.scripts.pop();
                    this.active = null;
                }

                return;
            }

            for (var i = 0; i < this.scripts.length; i++) {
                var script = this.scripts[i];
                if (!script.isInteractionTriggered &&
                    script.tryTrigger(this.hero, this.world, this.cameraController)) {
                    this.active = script;
                    return;
                }
            }
        }

         public update(cameraController: CameraControllers.ICameraController): void {
            this.cameraController = cameraController;
            this.triggerScriptedEvents();
        }

        public activate(scriptName: string): void {
            if (!this.active) {
                var script = this.scripts.first(s => s.name == scriptName);
                if (!script)
                    throw new Error("No script with the name {0} exists!".format(scriptName));
                if (script.tryTrigger(this.hero, this.world, this.cameraController)) {
                    this.active = script;
                };
            }
        }
    }
 }