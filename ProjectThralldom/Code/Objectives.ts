module Thralldom {

    export module Objectives {
        export class Objective {
            public group: number;
            public isComplete: boolean;

            constructor() {
                this.isComplete = false;
            }

            public loadFromDescription(description: any): void {
                this.group = description.group || 0;
            }

            public update(frameInfo: FrameInfo) {

            }

            public toString(output: string = "empty"): string {
                return output + (this.isComplete ? "✔" : "");
            }
        }

        export class ReachObjective extends Objective {

            private targetSelector: string;
            private target: THREE.Vector3;
            private radius: number;

            public loadFromDescription(description: any): void {
                if (!description.target) {
                    throw new Error("A reach objective must have a target!");
                }
                // If the target is a string and targets a tag we are in trouble, so raise exception
                if (description.target instanceof String && (<string> description.target).startsWith(".")) {
                    throw new TypeError("A reach objective's target must be either a vector or selector targeting an id, tags ARE NOT SUPPORTED");
                }
                super.loadFromDescription(description);

                if (description.target instanceof Array) {
                    this.target = new THREE.Vector3(description.target[0], description.target[1], description.target[2]);
                }
                else {
                    this.targetSelector = description.target;
                }

                this.radius = description.radius || 0;
                this.isComplete = false;
            }

            public update(frameInfo: FrameInfo) {
                if (this.targetSelector && !this.target) {
                    this.target = frameInfo.scene.select(this.targetSelector)[0].mesh.position;
                }
                if (frameInfo.hero.mesh.position.distanceToSquared(this.target) < this.radius * this.radius) {
                    this.isComplete = true;
                }
            }

            public toString(): string {
                var output: string;

                if (this.targetSelector) {
                    output = Utilities.formatString("Reach {0}", this.targetSelector);
                }
                else {
                    output = Utilities.formatString("Reach ({0}, {1}, {2})", this.target.x, this.target.y, this.target.z);
                }

                return super.toString(output);
            }
        }

        export class KillObjective extends Objective {

            private targetSelector: string;
            private achievedKills: number;
            private requiredKills: number;

            public loadFromDescription(description: any): void {
                if (!description.target) {
                    throw new Error("A reach objective must have a target!");
                }
                super.loadFromDescription(description);

                this.targetSelector = description.target;
                this.requiredKills = description.killCount || 1;
                this.achievedKills = 0;
                this.isComplete = false;
            }

            public update(frameInfo: FrameInfo) {
                // Detect all killing blows on the target.
                var count = Thralldom.Scene.match(this.targetSelector, frameInfo.killedEnemies);
                this.achievedKills += count;
                if (this.achievedKills >= this.requiredKills) {
                    this.isComplete = true;
                }
            }

            public toString(): string {
                var output = Utilities.formatString("Kill {0}. ({1}/{2})", this.targetSelector.substr(1), this.achievedKills, this.requiredKills);

                return super.toString(output);
            }
        }
    }
} 