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

        public audioContext: any;

        constructor() {
            this.audioContext = new (<any>window).AudioContext();
        }

        private onContentLoaded(path: string, object: any) {
            this.loaded++;
            this.loadedContent[path] = object;

            if (this.loading == this.loaded) {
                this.onLoaded();
            }

        }

        private onLoaded: () => void;

        private ajaxLoad(path: string, callback: (xhr: XMLHttpRequest) => void, isContent: boolean = true, responseType?: string) {
            if (isContent)
                this.loading++;

            var request = new XMLHttpRequest();
            request.open('GET', path, true);
            if (responseType)
                request.responseType = responseType;

            request.onload = () => { callback(request); };
            request.send();
        }

        private loadAudio(soundName: string, path: string, volume: number): void {
            this.ajaxLoad(path, (request: XMLHttpRequest) => {
                this.audioContext.decodeAudioData(request.response, (decoded) => {
                    this.onContentLoaded(soundName, () => {
                        return {
                            buffer: decoded,
                            volume: volume
                        };
                    });
                });
            }, true, "arraybuffer");
        }

        private loadSubtitles(path: string): void {
            this.ajaxLoad(path, (request: XMLHttpRequest) => {
                var subtitles = Subs.parse(request.responseText);
                this.onContentLoaded(path, () => subtitles);
            });
        }

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
            this.ajaxLoad(path, (xhr: XMLHttpRequest) => {
                var animDescription = eval("Object(" + xhr.responseText + ")");
                var animationData = [];
                for (var animation in animDescription) {
                    var normalizedName = animation[0].toUpperCase() + animation.substr(1).toLowerCase();
                    animationData[CharacterStates[normalizedName]] = animDescription[animation];
                }

                var duplicate = () => animationData;
                this.onContentLoaded(path, duplicate);
            });
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

        private parseSettings(worldDescription: any): void {
            // Physics first!
            this.parsePhysics(worldDescription.physics);
            var settings = worldDescription.settings;
            PhysicsManager.attachDebuggingVisuals = settings.debugDraw || false;

            var controllerSettings = worldDescription.controller;
            if (!controllerSettings.angularSpeed) {
                throw new Error("Some or all of character controller settings are missing!");
            }

            Thralldom.CharacterControllers.SkyrimCharacterController.defaultSettings = controllerSettings;

            var characterSettings = worldDescription.character;
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

        private tryAddSingletonDescription(array: Array<any>, worldDescription: any, type: string): void {
            if (worldDescription[type]) {
                worldDescription[type].type = type;
                worldDescription[type].id = type;
                array.push(worldDescription[type]);
            }
        }

        private loadAI(world: Thralldom.World, graph: Algorithms.IGraph): void {
            world.aiManager.graph = graph;

            for (var typeName in ContentManager.aiControllerTypes) {
                var type = ContentManager.aiControllerTypes[typeName];

                var controllers = <Array<AI.AIController>> world.selectByTag(typeName).map((character) => new type(character, graph));
                world.aiManager.controllers = world.aiManager.controllers.concat(controllers);
            }
        }

        private parseWorld(path: string, worldDescription: any): Thralldom.World {
            // Settings first
            this.parseSettings(worldDescription);

            var world = new World();

            this.parseCollection(worldDescription.dynamics, ContentManager.dynamicTypes, world.addDynamic.bind(world));
            this.parseCollection(worldDescription.statics, ContentManager.staticTypes, world.addStatic.bind(world));

            var singletons = [];
            this.tryAddSingletonDescription(singletons, worldDescription, "skybox");
            this.tryAddSingletonDescription(singletons, worldDescription, "terrain");
            this.parseCollection(singletons, ContentManager.staticTypes, world.addStatic.bind(world));

            if (!worldDescription.waypoints) {
                console.error("No pathfinding graph supplied to scene, AI cannot work!");
            }

            var graph = {
                nodes: worldDescription.waypoints.nodes.map((array) => new Algorithms.Vertex(array[0], array[1])),
                edges: worldDescription.waypoints.edges.map((array) => new Algorithms.Edge(array[0], array[1])),
            }

            this.loadAI(world, graph);

            return world;
        }

        private loadWorld(path: string): void {
            this.ajaxLoad(path, (xhr: XMLHttpRequest) => {
                var worldDescription = eval("Object(" + xhr.responseText + ")");
                var world = this.parseWorld(path, worldDescription);

                this.onContentLoaded(path, () => world);
            });
        }

        private loadQuest(path: string): void {
            this.ajaxLoad(path, (xhr: XMLHttpRequest) => {
                var questDescription = eval("Object(" + xhr.responseText + ")");
                var quest = new Quest();
                quest.name = quest["name"];
                this.parseCollection(questDescription.objectives, ContentManager.objectiveTypes, quest.objectives.push.bind(quest.objectives));

                this.onContentLoaded(path, () => quest);
            });
        }

        private loadScript(path: string): void {
            this.ajaxLoad(path, (xhr: XMLHttpRequest) => {
                var scriptDescription = xhr.responseText;
                var script = new ScriptedEvent();
                script.loadFromDescription(scriptDescription, this);

                this.onContentLoaded(path, () => script);
            });
        }

        private loadAssets(path: string): void {
            this.ajaxLoad(path, (xhr: XMLHttpRequest) => {
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
                for (var i in assets.audio) {
                    this.loadAudio(assets.audio[i].sound, assets.audio[i].path, assets.audio[i].volume);
                }
                for (var i in assets.subtitles) {
                    this.loadSubtitles(assets.subtitles[i]);
                }
            }, false);
        }


        public loadMeta(path: string, callback: (meta: IMetaGameData) => void): void {
            this.ajaxLoad(path, (xhr: XMLHttpRequest) => {

                var meta: IMetaGameData = eval("Object(" + xhr.responseText + ")");

                if (!meta.world) {
                    throw new Error("Must provide a World!");
                }
                if (!meta.quest) {
                    throw new Error("Must provide a quest!");
                }

                this.loadAssets(meta.assets);

                this.onLoaded = () => {
                    // Once all the assets have been loaded, load the world and quests since they depend on the assets
                    this.loadWorld(meta.world);
                    this.loadQuest(meta.quest);
                    for (var i = 0; i < meta.scripts.length; i++) {
                        this.loadScript(meta.scripts[i]);
                    }


                    this.onLoaded = () => {
                        this.onContentLoaded(path, () => meta);
                        callback(meta);
                    }
                };
            }, false);
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