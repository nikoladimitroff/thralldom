module Thralldom {

    export module Objectives {
        export class Objective implements ILoadable, IDrawable {
            public group: number;
            public isComplete: boolean;
            public mesh: THREE.Mesh;
            public markerYaw: number = 0;
            public markerBiasY: number = 0;
            public markerStep: number = 0.025;
            public text: string;

            constructor() {
                this.isComplete = false;
            }

            public static getMarkerOffset(mesh: THREE.Mesh): number {
                return mesh.scale.x * (mesh.geometry.boundingBox.max.y + (mesh.geometry.boundingBox.max.y - mesh.geometry.boundingBox.min.y) / 2);
            }

            public loadFromDescription(description: any, content: ContentManager): void {
                this.group = description.group || 0;
            }

            public update(frameInfo: FrameInfo) {
                if (this.isComplete) {
                    this.mesh.visible = false;
                }
                var quat = new THREE.Quaternion();
                quat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 1000);
                quat.multiply(this.mesh.quaternion);
                this.mesh.quaternion.copy(quat);

                this.mesh.position.y += this.markerBiasY;
                this.markerBiasY += this.markerStep;
                if (Math.abs(this.markerBiasY) > 2) {
                    this.markerStep = -this.markerStep;
                }

            }

            public toString(output: string = "empty"): string {
                return output + (this.isComplete ? "✔" : "");
            }
        }

        export class ReachObjective extends Objective {

            private targetSelector: string;
            private target: THREE.Vector3;
            private radius: number;

            private static DefaultText = "";

            public loadFromDescription(description: any, content: ContentManager): void {
                if (!description.target) {
                    throw new Error("A reach objective must have a target!");
                }
                // If the target is a string and targets a tag we are in trouble, so raise exception
                if (description.target instanceof String && (<string> description.target).startsWith(".")) {
                    throw new TypeError("A reach objective's target must be either a vector or selector targeting an id, tags ARE NOT SUPPORTED");
                }
                super.loadFromDescription(description, content);

                if (description.target instanceof Array) {
                    this.target = new THREE.Vector3(description.target[0], description.target[1], description.target[2]);
                }
                else {
                    this.targetSelector = description.target;
                }
                if (description.text && ReachObjective.DefaultText != description.text) {
                    ReachObjective.DefaultText = description.text;
                }
                this.text = ReachObjective.DefaultText;

                this.radius = description.radius || 0;
                this.isComplete = false;

                this.mesh = GeometryUtils.getQuestMarker(content);
            }

            public update(frameInfo: FrameInfo) {
                var offset = 0;
                if (this.targetSelector) {
                    var target = frameInfo.world.select(this.targetSelector)[0].mesh;
                    this.target = target.position;
                    offset = Objective.getMarkerOffset(target);
                }
                else {
                    offset = Objective.getMarkerOffset(this.mesh);
                }
                if (frameInfo.hero.mesh.position.distanceToSquared(this.target) < this.radius * this.radius) {
                    this.isComplete = true;
                }

                this.mesh.position.copy(this.target);
                this.mesh.position.y += offset;

                super.update(frameInfo);
            }

            public toString(): string {
                return super.toString(this.text);
            }
        }

        export class KillObjective extends Objective {

            private targetSelector: string;
            private achievedKills: number;
            private requiredKills: number;

            private static DefaultText = "";

            public loadFromDescription(description: any, content: ContentManager): void {
                if (!description.target) {
                    throw new Error("A kill objective must have a target!");
                }
                super.loadFromDescription(description, content);


                if (KillObjective.DefaultText != description.text) {
                    KillObjective.DefaultText = KillObjective.DefaultText;
                }
                this.text = description.text;

                this.targetSelector = description.target;
                this.requiredKills = description.killCount || 1;
                this.achievedKills = 0;
                this.isComplete = false;

                this.mesh = GeometryUtils.getQuestMarker(content);
            }

            private static getCloserTargetComparer(heroPos: THREE.Vector3): (a: LoadableObject, b: LoadableObject) => number {
                return (a, b) => a.mesh.position.distanceToSquared(heroPos) - b.mesh.position.distanceToSquared(heroPos);
            }

            public update(frameInfo: FrameInfo) {
                // Detect all killing blows on the target.
                var count = Thralldom.World.countMatches(this.targetSelector, frameInfo.killedEnemies);
                this.achievedKills += count;
                if (this.achievedKills >= this.requiredKills) {
                    this.isComplete = true;
                    return;
                }
                var heroPos: THREE.Vector3 = frameInfo.hero.mesh.position;
                var targets: Array<LoadableObject> =
                    frameInfo.world.select(this.targetSelector).sort(KillObjective.getCloserTargetComparer(heroPos));
                if (targets.length == 0) {
                    throw new Error("No enemies of this type alive!");
                }

                var nextTarget = targets[0];

                this.mesh.position.copy(nextTarget.mesh.position);
                this.mesh.position.y += Objective.getMarkerOffset(nextTarget.mesh);

                super.update(frameInfo);
            }

            public toString(): string {
                var output = "{0} {1}. ({2}/{3})".format(this.text, this.targetSelector.substr(1), this.achievedKills, this.requiredKills);

                return super.toString(output);
            }
        }
    }
} 