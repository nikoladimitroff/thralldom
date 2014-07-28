module Thralldom {
    export class ScriptedEvent implements ILoadable {
        private actions: IIndexable<(args: string, content: ContentManager, extras: IExtraScriptedData) => void> =
                <any>[GotoAction, LookAtAction, WaitAction, DialogAction, StoryAction, FlyAction].reduce((previous: any, current) => {
                    previous[current.Keyword] = current;
                    return previous;
                }, {});

        private trigger: any;
        private triggerRadius: number;
        public actors: IIndexable<ScriptController>;
        public storyteller: Storyteller;


        public get finished(): boolean {
            var finished = true;

            for (var name in this.actors) {
                finished = finished && this.actors[name].finished;
            }

            return finished;
        }

        constructor() {
            this.actors = <IIndexable<ScriptController>> {};
        }

        public tryTrigger(playerCharacter: Character, world: Thralldom.World, camController: CameraControllers.ICameraController): boolean {
            var characterPos = GeometryUtils.Vector3To2(playerCharacter.mesh.position);
            var trigger = typeof this.trigger == "string"
                ? GeometryUtils.Vector3To2(world.select(<any>this.trigger)[0].mesh.position)
                : this.trigger;

            var canTrigger = !this.finished && characterPos.distanceToSquared(trigger) <= this.triggerRadius * this.triggerRadius;

            if (canTrigger) {
                var actors = this.actors;
                for (var name in actors) {
                    var character = world.selectByDynamicId(name);
                    var controller = world.controllerManager.controllers.filter((controller) => controller.character == character)[0];
                    if (!controller) {
                        console.warn("No matching character with id {0} found when activatin script".format(name));
                        actors[name].finished = true;
                        continue;
                    }
                    controller.script = actors[name];
                    controller.script.trigger(controller.character, camController);
                }
            }

            return canTrigger;
        }

        public disable(world: Thralldom.World): void {
            var actors = this.actors;
            for (var name in actors) {
                var character = world.selectByDynamicId(name);
                var controller = world.controllerManager.controllers.filter((controller) => controller.character == character)[0];
                if (!controller) {
                    console.warn("No matching character with id {0} found when disabling script".format(name));
                    continue;
                }
                controller.script = null;
            }
        }

        private parseAction(line: string, content: ContentManager): IScriptedAction {
            // Skip if the line contains only whitespace
            if (line.match(/\s*/g)[0] == line) {
                return;
            }

            var descriptors = line.split(MultiAction.Keyword);
            var actions = [];
            for (var i = 0; i < descriptors.length; i++) {
                var type = descriptors[i].substr(0, descriptors[i].indexOf(' '));
                var args = descriptors[i].substr(descriptors[i].indexOf(' ') + 1);
                var action = new this.actions[type](args, content, { storyteller: this.storyteller });
                actions.push(action);
            }
            if (actions.length == 1) 
                return actions[0]

            return new MultiAction(actions, content, undefined);
        }

        public loadFromDescription(script: string, content: ContentManager): void {
            var column = ":";
            var blockSeparator = "*";
            var linePattern = /[^\r\n]+/g;

            var blocks = script.split(blockSeparator);

            // Parse settings (shift the array so that are only left with actors and no settings)
            var settings = blocks.shift().match(linePattern);
            for (var i = 0; i < settings.length; i++) {
                var line = settings[i];
                var triggerIndex = line.indexOf("trigger at ") + "trigger at ".length;
                if (triggerIndex != -1) {
                    var noprefix = line.substr(triggerIndex);
                    if (noprefix.startsWith("#")) {
                        var spaceIndex = noprefix.indexOf(" ");
                        var triggerText = line.substr(triggerIndex, spaceIndex);
                        this.trigger = triggerText;
                        this.triggerRadius = parseFloat(line.substr(line.lastIndexOf(" ") + 1));
                    }
                    else {
                        var paranthesis = noprefix.indexOf(")");
                        var triggerText = line.substr(triggerIndex, paranthesis + 1);
                        this.trigger = Utils.parseVector2(triggerText);
                        this.triggerRadius = parseFloat(line.substr(line.lastIndexOf(" ") + 1));
                    }
                }
            }

            // Parse the actions for each actor
            for (var i = 0; i < blocks.length; i++) {
                var lines = blocks[i].match(linePattern);
                var actor = lines.shift().replace(blockSeparator, "").replace(column, "");

                var storyMark = "$"
                if (actor[0] == storyMark) {
                    // It's not an actor, rather it is story text
                    this.storyteller = new FixedStoryteller(lines.filter((value) => value.trim() != ""));
                    continue;
                }
            
                var sequence = [];
                for (var j = 0; j < lines.length; j++) {
                    var action = this.parseAction(lines[j], content);
                    sequence.push(action);
                }
                this.actors[actor] = new ScriptController(sequence);
            }
        }
    }
} 