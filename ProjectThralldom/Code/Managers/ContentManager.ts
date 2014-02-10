module Thralldom {
    export class ContentManager {

        private loadedContent: Map<string, any> = <Map<string, any>>{};

        private loaded: number = 0;
        private loading: number = 0;


        private onContentLoaded(path: string, object: any) {
            this.loaded++;
            this.loadedContent[path] = object;

            if (this.loading == this.loaded) {
                this.onLoaded();
            }

        }

        public onLoaded: () => void;

        public loadTexture(path: string, compressed?: boolean): void {
            
            this.loading++;

            if (compressed) {
                throw new Error("not supported");
            }
            else {
                THREE.ImageUtils.loadTexture(path, 0, (texture) => this.onContentLoaded(path, () => texture));
            }
        }

        public loadModel(path: string): void {
            this.loading++;

            var loader = new THREE.JSONLoader();
            var mesh: THREE.Object3D;
            loader.load(path, (geometry, materials) => {
                geometry.computeFaceNormals();
                geometry.computeVertexNormals();
                var duplicate = () => new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));
                this.onContentLoaded(path, duplicate);
            });
        }

        public loadSkinnedModel(path: string): void {
            this.loading++;

            var loader = new THREE.JSONLoader();
            var mesh: THREE.Object3D;

            function ensureLoop(animation) {
                for (var i = 0; i < animation.hierarchy.length; i++) {

                    var bone = animation.hierarchy[i];

                    var first = bone.keys[0];
                    var last = bone.keys[bone.keys.length - 1];

                    last.pos = first.pos;
                    last.rot = first.rot;
                    last.scl = first.scl;
                }
            }

            loader.load(path, (geometry, materials) => {

                ensureLoop(geometry.animation);
                THREE.AnimationHandler.add(geometry.animation);

                for (var i = 0; i < materials.length; i++) {

                    var m = <any> materials[i];
                    m.skinning = true;
                    m.ambient.copy(m.color);

                    m.wrapAround = true;
                    m.perPixel = true;
                }

                var duplicate = () => new THREE.SkinnedMesh(geometry, new THREE.MeshFaceMaterial(materials));
                this.onContentLoaded(path, duplicate);
            });
        }

        public loadScene(path: string): void {
            this.loading++;

            var xhr = new XMLHttpRequest();
            xhr.open("GET", path, true);

            xhr.onreadystatechange = () => {
                if (xhr.readyState == 4) {
                    var sceneDescription = eval("Object(" + xhr.responseText + ")");
                    var scene = new Scene();
                    scene.name = sceneDescription["name"];

                    for (var i = 0; i < sceneDescription.dynamics.length; i++) {
                        var object = sceneDescription.dynamics[i];
                        switch (object["type"].toLowerCase()) {
                            case "character":
                                var character = new Character(this);
                                character.loadFromDescription(object, this);
                                scene.addDynamic(character);
                                break;

                            default:
                                throw new Error("Invalid type!");
                        };
                    }

                    this.onContentLoaded(path, () => scene);
                }
            }
            xhr.send();
        }

        public loadQuest(path: string): void {
            this.loading++;

            var xhr = new XMLHttpRequest();
            xhr.open("GET", path, true);

            xhr.onreadystatechange = () => {
                if (xhr.readyState == 4) {
                    var questDescription = eval("Object(" + xhr.responseText + ")");
                    var quest = new Quest();
                    quest.name = quest["name"];

                    for (var i = 0; i < questDescription.objectives.length; i++) {
                        var description = questDescription.objectives[i];
                        var objective: Thralldom.Objectives.Objective;
                        switch (description["type"].toLowerCase()) {
                            case "reach":
                                objective = new Thralldom.Objectives.ReachObjective();
                                break;
                            case "kill":
                                objective = new Thralldom.Objectives.KillObjective();
                                break;

                            default:
                                throw new Error("Invalid type!");
                                break;
                        };
                        objective.loadFromDescription(description);
                        quest.objectives.push(objective);
                    }

                    this.onContentLoaded(path, () => quest);
                }
            }
            xhr.send();
        }
        
        public getContent(path: string): any {
            if (this.loadedContent[path]) {
                return this.loadedContent[path]();
            }
            else {
                throw new Error("content not loaded");
            }
        }
    }
} 