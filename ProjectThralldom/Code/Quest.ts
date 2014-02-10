module Thralldom {
    export class Quest {

        public name: string;
        public objectives: Array<Objectives.Objective>;
        private currentGroup: number;

        constructor() {
            this.objectives = [];
            this.name = "";
            this.currentGroup = 0;
        }

        public getActiveObjectives(): Array<Objectives.Objective> {
            return this.objectives.filter((x) => x.group == this.currentGroup);
        }  

        public update(frameInfo: FrameInfo): void {
            for (var i = 0; i < this.objectives.length; i++) {
                this.objectives[i].update(frameInfo);
            }

            // If all objectives in the current group are complete, increment the current group
            if (this.getActiveObjectives().every((x) => x.isComplete)) {
                this.currentGroup++;
            }
        }

        public toString(): string {
            return <string> this.getActiveObjectives().reduce((val, objective) => val += objective.toString() + "\n", "");
        }
    }
} 