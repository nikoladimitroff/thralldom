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

        private static aiControllerTypes = {
            "citizen": Thralldom.AI.Citizen,
            "guard": Thralldom.AI.Guard,
        }


        private onContentLoaded(path: string, object: any) {
            this.loaded++;
            this.loadedContent[path] = object;

            if (this.loading == this.loaded) {
                this.onLoaded();
            }

        }

        private onLoaded: () => void;

        private loadTexture(path: string, compressed?: boolean): void {
            
            this.loading++;

            if (compressed) {
                throw new Error("not supported");
            }
            else {
                THREE.ImageUtils.loadTexture(path, 0, (texture) => this.onContentLoaded(path, () => texture));
            }
        }

        private loadModel(path: string): void {
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

        private loadAnimationData(path: string): void {
            this.loading++;

            var xhr = new XMLHttpRequest();
            xhr.open("GET", path, true);

            xhr.onreadystatechange = () => {
                if (xhr.readyState == 4) {
                    if (xhr.status == 404) {
                        console.log("WARNING: Can't find animations file for model: " + path);
                        return;
                    }

                    var animDescription = eval("Object(" + xhr.responseText + ")");
                    var animationData = [];
                    for (var animation in animDescription) {
                        var normalizedName = animation[0].toUpperCase() + animation.substr(1).toLowerCase();    
                        animationData[CharacterStates[normalizedName]] = animDescription[animation];
                    }

                    var duplicate = () => animationData;
                    this.onContentLoaded(path, duplicate);
                }
            };
            xhr.send();
        }

        public getAnimationFilePath(meshPath: string): string {
            var modelFile = this.extractFileName(meshPath);
            var animationFile = modelFile.substring(0, modelFile.lastIndexOf('.')) + ".anim";
            var animationFile = meshPath.replace(modelFile, animationFile);
            return animationFile
        }

        private loadSkinnedModel(path: string, hasAnimationData: boolean = true): void {
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

            // Load the model and its animation data
            if (hasAnimationData) {
                this.loadAnimationData(this.getAnimationFilePath(path));
            }

            loader.load(path, (geometry, materials) => {

                ensureLoop(geometry.animation);
                geometry.animation.name += path;
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
            physicsDescription.linearDamping = physicsDescription.linearDamping || 0;
            physicsDescription.angularDamping = physicsDescription.angularDamping || 0;

            PhysicsManager.defaultSettings = physicsDescription;
        }

        private parseSettings(sceneDescription: any): void {
            // Physics first!
            this.parsePhysics(sceneDescription.physics);
            var settings = sceneDescription.settings;
            PhysicsManager.attachDebuggingVisuals = settings.debugDraw || false;

            var controllerSettings = sceneDescription.controller;
            if (!controllerSettings.angularSpeed) {
                throw new Error("Some or all of character controller settings are missing!");
            }

            Thralldom.CharacterControllers.SkyrimCharacterController.defaultSettings = controllerSettings;

            var characterSettings = sceneDescription.character;
            if (!characterSettings.mass || !characterSettings.jumpImpulse || !characterSettings.viewAngle ||
                !characterSettings.movementSpeed || !characterSettings.sprintMultiplier) {
                throw new Error("Some or all character settings are missing!");
            }
            Thralldom.Character.defaultSettings = characterSettings;

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

        private loadAI(scene: Thralldom.Scene, graph: Algorithms.IGraph): void {
            scene.aiManager.graph = graph;

            for (var typeName in ContentManager.aiControllerTypes) {
                var type = ContentManager.aiControllerTypes[typeName];

                var controllers = <Array<AI.AIController>> scene.selectByTag(typeName).map((character) => new type(character, graph));
                scene.aiManager.controllers = scene.aiManager.controllers.concat(controllers);
            }
        }

        private parseScene(path: string, sceneDescription: any): Thralldom.Scene {
            // Settings first
            this.parseSettings(sceneDescription);

            var scene = new Scene();

            this.parseCollection(sceneDescription.dynamics, ContentManager.dynamicTypes, scene.addDynamic.bind(scene));
            this.parseCollection(sceneDescription.statics, ContentManager.staticTypes, scene.addStatic.bind(scene));

            var singletons = [];
            this.tryAddSingletonDescription(singletons, sceneDescription, "skybox");
            this.tryAddSingletonDescription(singletons, sceneDescription, "terrain");
            this.parseCollection(singletons, ContentManager.staticTypes, scene.addStatic.bind(scene));

            if (!sceneDescription.waypoints) {
                console.error("No pathfinding graph supplied to scene, AI cannot work!");
            }

            var graph = {
                nodes: sceneDescription.waypoints.nodes.map((array) => new Algorithms.Vertex(array[0], array[1])),
                edges: sceneDescription.waypoints.edges.map((array) => new Algorithms.Edge(array[0], array[1])),
            }

            this.loadAI(scene, graph);

            return scene;
        }

        private loadScene(path: string): void {
            this.loading++;

            var xhr = new XMLHttpRequest();
            xhr.open("GET", path, true);

            xhr.onreadystatechange = () => {
                if (xhr.readyState == 4) {
                    var sceneDescription = eval("Object(" + xhr.responseText + ")");
                    var scene = this.parseScene(path, sceneDescription);

                    this.onContentLoaded(path, () => scene);
                }
            };
            xhr.send();
        }

        private loadQuest(path: string): void {
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


        private loadScript(path: string): void {
            this.loading++;

            var xhr = new XMLHttpRequest();
            xhr.open("GET", path, true);

            xhr.onreadystatechange = () => {
                if (xhr.readyState == 4) {
                    var scriptDescription = xhr.responseText;
                    var script = new ScriptedEvent();
                    script.loadFromDescription(scriptDescription, this);

                    this.onContentLoaded(path, () => script);
                }
            }
            xhr.send();
        }

        private loadAssets(path: string): void {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", path, true);

            xhr.onreadystatechange = () => {
                if (xhr.readyState == 4) {
                    var assets = eval("Object(" + xhr.responseText + ")");
                    for (var i in assets.textures) {
                        this.loadTexture(assets.textures[i]);
                    }
                    for (var i in assets.skinned) {
                        this.loadSkinnedModel(assets.skinned[i].path, assets.skinned[i].animationData);
                    }
                    for (var i in assets.models) {
                        this.loadModel(assets.models[i]);
                    }
                }
            }
            xhr.send();
        }


        public loadMeta(path: string, callback: (meta: IMetaGameData) => void): void {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", path, true);

            xhr.onreadystatechange = () => {
                if (xhr.readyState == 4) {
                    var meta = eval("Object(" + xhr.responseText + ")");

                    if (!meta.scene) {
                        throw new Error("Must provide a scene!");
                    }
                    if (!meta.quest) {
                        throw new Error("Must provide a quest!");
                    }

                    this.loadAssets(meta.assets);
                    this.onLoaded = () => {

                        this.loadScene(meta.scene);
                        this.loadQuest(meta.quest);

                        for (var i = 0; i < meta.scripts.length; i++) {
                            this.loadScript(meta.scripts[i]);
                        }

                        this.onLoaded = () => {
                            this.onContentLoaded(path, () => meta);

                            callback(meta);
                        }
                    };
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