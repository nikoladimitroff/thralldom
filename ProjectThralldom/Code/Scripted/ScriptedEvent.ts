module Thralldom {
    export class ScriptedEvent implements ILoadable {
        private actions: Map<String, Function> = <Map<String, Function>> [GotoAction, LookAt, WaitFor].reduce((previous: any, current) => {
            previous[current.Keyword] = current;
            return previous;
        }, {});

        private trigger: THREE.Vector3;
        private triggerRadius: number;
        public actors: Map<string, ScriptController>;

        constructor() {
            this.actors = <Map<string, ScriptController>> {};
        }

        public tryTrigger(character: Character, scene: Thralldom.Scene): boolean {
            return character.mesh.position.distanceTo(this.trigger) <= this.triggerRadius;
        }

        private parseAction(line: string): IScriptedAction {
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
                if (line.startsWith("trigger at")) {
                    this.trigger = Utilities.parseVector3(line.match(/\(.*\)/g)[0]);
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