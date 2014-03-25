module Thralldom {
    export class ScriptedEvent implements ILoadable {
        private actions: Map<String, Function> = <Map<String, Function>> [GotoAction, LookAt, WaitFor].reduce((previous: any, current) => {
            previous[current.Keyword] = current;
            return previous;
        }, {});

        private trigger: THREE.Vector2;
        private triggerRadius: number;
        public actors: Map<string, ScriptController>;

        public get finished(): boolean {
            var finished = true;

            for (var name in this.actors) {
                finished = finished && this.actors[name].finished;
            }

            return finished;
        }

        constructor() {
            this.actors = <Map<string, ScriptController>> {};
        }

        public tryTrigger(playerCharacter: Character, scene: Thralldom.World): boolean {
            var characterPos = GeometryUtils.Vector3To2(playerCharacter.mesh.position);
            var canTrigger = !this.finished && characterPos.distanceToSquared(this.trigger) <= this.triggerRadius * this.triggerRadius;

            if (canTrigger) {
                var actors = this.actors;
                for (var name in actors) {
                    var character = scene.selectByDynamicId(name);
                    var controller = scene.aiManager.controllers.filter((controller) => controller.character == character)[0];
                    if (!controller) {
                        console.log(Utilities.formatString("No matching character with id {0} found when activatin script", name));
                        actors[name].finished = true;
                        continue;
                    }
                    controller.script = actors[name];
                    controller.script.trigger();
                }
            }

            return canTrigger;
        }

        public disable(scene: Thralldom.World): void {
            var actors = this.actors;
            for (var name in actors) {
                var character = scene.selectByDynamicId(name);
                var controller = scene.aiManager.controllers.filter((controller) => controller.character == character)[0];
                if (!controller) {
                    console.log(Utilities.formatString("No matching character with id {0} found when disabling script", name));
                    continue;
                }
                controller.script = null;
            }
        }

        private parseAction(line: string): IScriptedAction {
            // Skip if the line contains only whitespace
            if (line.match(/\s*/g)[0] == line) {
                return;
            }

            var descriptors = line.split(MultiAction.Keyword);
            var actions = [];
            for (var i = 0; i < descriptors.length; i++) {
                var type = descriptors[i].substr(0, descriptors[i].indexOf(' '));
                var args = descriptors[i].substr(descriptors[i].indexOf(' ') + 1);
                var action = new this.actions[type](args);
                actions.push(action);
            }
            if (actions.length == 1) 
                return actions[0]
            return new MultiAction(actions);
        }

        public loadFromDescription(script: string, content: ContentManager): void {
            var column = ":";
            var hashtag = "#";
            var linePattern = /[^\r\n]+/g;

            var blocks = script.split(hashtag);

            // Parse settings (shift the array so that are only left with actors and no settings)
            var settings = blocks.shift().match(linePattern);
            for (var i = 0; i < settings.length; i++) {
                var line = settings[i];
                if (line.indexOf("trigger at") != -1) {
                    this.trigger = Utilities.parseVector2(line.match(/\(.*\)/g)[0]);
                    this.triggerRadius = parseFloat(line.substr(line.lastIndexOf(" ") + 1));
                }
            }

            // Parse the actions for each actor
            for (var i = 0; i < blocks.length; i++) {
                var lines = blocks[i].match(linePattern);
                var actor = lines.shift().replace(hashtag, "").replace(column, "");
                var sequence = [];
                for (var j = 0; j < lines.length; j++) {
                    var action = this.parseAction(lines[j]);
                    sequence.push(action);
                }
                this.actors[actor] = new ScriptController(sequence);
            }
        }
    }
} 