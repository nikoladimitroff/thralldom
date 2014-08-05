module Thralldom {
    export class Quest {

        public name: string;
        public objectives: Array<Objectives.Objective>;
        private currentGroup: number;

        constructor() {
            this.objectives = [];
            this.name = "";
            this.currentGroup = -1;
        }

        public getActiveObjectives(): Array<Objectives.Objective> {
            return this.objectives.filter(x => x.group == this.currentGroup);
        }  

        public update(frameInfo: FrameInfo, world: World): void {
            for (var i = 0; i < this.objectives.length; i++) {
                this.objectives[i].update(frameInfo);
            }

            // If all objectives in the current group are complete, increment the current group
            var active: Array<Objectives.Objective> = this.getActiveObjectives();
            if (active.every(x => x.isComplete)) {
                this.currentGroup++;
                for (var i = 0; i < active.length; i++) {
                    world.remove(active[i]);
                }
                var next = this.getActiveObjectives();
                for (var i = 0; i < next.length; i++) {
                    world.addDrawable(next[i]);
                }
            }
        }

        public toString(): string {
            var objectives = this.getActiveObjectives();
            if (objectives.length == 0)
                return "{0} complete!".format(this.name);    
            // 4 spaces below to indent the objectives  
            return this.name + ":\n" + objectives.map(o => "&nbsp;&nbsp;&nbsp;&nbsp;" + o.toString()).join("\n");
        }
    }
} 