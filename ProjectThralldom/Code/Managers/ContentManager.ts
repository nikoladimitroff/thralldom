module Thralldom {
    export class ContentManager {

        private loadedContent: Map<string, any> = <Map<string, any>>{};

        private loaded: number = 0;
        private loading: number = 0;

        private static dynamicTypes = {
            "character": Character,
        }; 
        private static staticTypes = {
            "environment": Environment,
            "skybox": Skybox,
            "terrain": Terrain,
        }
        private static objectiveTypes = {
            "reach": Thralldom.Objectives.ReachObjective,
            "kill": Thralldom.Objectives.KillObjective,
        }


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

        private parsePhysics(physicsDescription: any): void {

            physicsDescription.friction = physicsDescription.friction || 1;
            physicsDescription.restitution = physicsDescription.restitution || 0;
            physicsDescription.gravity = physicsDescription.gravity || -9.82;
            physicsDescription.contactStiffness = physicsDescription.contactStifness || 1e10;
            physicsDescription.contactRegularizationTime = physicsDescription.contactRegularizationTime || 20;
            physicsDescription.frictionStiffness = physicsDescription.frictionStiffness || 1e10;
            physicsDescription.frictionRegularizationTime = physicsDescription.frictionRegularizationTime || 20;
            physicsDescription.linearDamping = physicsDescription.linearDamping || 0.3;

            var physicsMaterial = new CANNON.Material("defaultMaterial");
            var physicsContactMaterial = new CANNON.ContactMaterial(physicsMaterial,
                physicsMaterial,
                physicsDescription.friction, // friction coefficient
                physicsDescription.restitution  // restitution
                );

            physicsContactMaterial.contactEquationStiffness = physicsDescription.contactStiffness;
            physicsContactMaterial.contactEquationRegularizationTime = physicsDescription.contactRegularizationTime;
            physicsContactMaterial.frictionEquationStiffness = physicsDescription.frictionStiffness;
            physicsContactMaterial.frictionEquationRegularizationTime = physicsDescription.frictionRegularizationTime;


            PhysicsManager.material = physicsMaterial;
            PhysicsManager.contactMaterial = physicsContactMaterial;
            PhysicsManager.gravityAcceleration = physicsDescription.gravity;
            PhysicsManager.linearDamping = physicsDescription.linearDamping;
        }

        private parseCollection(collectionDescription: Array<any>, typeMapping: any, callback: (instance: ILoadable) => void): void {
            for (var i = 0; i < collectionDescription.length; i++) {
                var object = collectionDescription[i];
                var type = typeMapping[object.type.toLowerCase()];
                if (type) {
                    var instance = new type();
                    instance.loadFromDescription(object, this);
                    callback(instance)
                }
                else {
                    throw new Error("Invalid type!");
                }
            }
        }

        private tryAddSingletonDescription(array: Array<any>, sceneDescription: any, type: string): void {
            if (sceneDescription[type]) {
                sceneDescription[type].type = type;
                sceneDescription[type].id = type;
                array.push(sceneDescription[type]);
            }
        }

        private parseScene(path, sceneDescription: any): void {
            // Physics first!
            this.parsePhysics(sceneDescription.physics);
            var settings = sceneDescription.settings;
            PhysicsManager.attachDebuggingVisuals = settings.debugDraw || false;
            Thralldom.CameraControllers.SkyrimCameraController.angularSpeed = settings.cameraAngularSpeed || 10 * Math.PI;
            Thralldom.CameraControllers.SkyrimCameraController.movementSpeed = settings.cameraMovementSpeed || 2 * 1e+6;

            var scene = new Scene();
            scene.name = sceneDescription["name"];

            this.parseCollection(sceneDescription.dynamics, ContentManager.dynamicTypes, scene.addDynamic.bind(scene));
            this.parseCollection(sceneDescription.statics, ContentManager.staticTypes, scene.addStatic.bind(scene));

            var singletons = [];
            this.tryAddSingletonDescription(singletons, sceneDescription, "skybox");
            this.tryAddSingletonDescription(singletons, sceneDescription, "terrain");
            this.parseCollection(singletons, ContentManager.staticTypes, scene.addStatic.bind(scene));

            this.onContentLoaded(path, () => scene);
        }

        public loadScene(path: string): void {
            this.loading++;

            var xhr = new XMLHttpRequest();
            xhr.open("GET", path, true);

            xhr.onreadystatechange = () => {
                if (xhr.readyState == 4) {
                    var sceneDescription = eval("Object(" + xhr.responseText + ")");
                    this.parseScene(path, sceneDescription);
                }
            };
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
                    this.parseCollection(questDescription.objectives, ContentManager.objectiveTypes, quest.objectives.push.bind(quest.objectives));

                    this.onContentLoaded(path, () => quest);
                }
            }
            xhr.send();
        }

        private extractFileName(path: string): string {
            return path.replace(/^.*[\\\/]/, '');
        }
        
        public getContent(path: string): any {
            if (this.loadedContent[path]) {
                return this.loadedContent[path]();
            }
            // Else see if the path is only a filename. If it is, try to find that file in another location
            else if (path == this.extractFileName(path)) {
                for (var index in this.loadedContent) {
                    if (this.extractFileName(index) == path) {
                        return this.loadedContent[index]();
                    }
                }
            }
            else {
                throw new Error("content not loaded");
            }
        }
    }
} 