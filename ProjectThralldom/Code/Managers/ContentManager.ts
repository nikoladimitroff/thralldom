module Thralldom {
    export interface IProgressNotifier {
        update(percentage: number, text: string): void;
    }

    export var SpecialContents = {
        Items: "ItemsDb",
    }

    export class ContentManager {

        private loadedContent: IIndexable<any> = <IIndexable<any>>{};

        private loaded: number = 0;
        private loading: number = 0;
        private totalQueuedItems: number = 0;

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

        private static controllerTypes = {
            "citizen": Thralldom.AI.Citizen,
            "guard": Thralldom.AI.Guard,
            "statue": Thralldom.AI.Statue,

            "skyrim": Thralldom.CharacterControllers.SkyrimCharacterController,
        }

        private progressNotifier: IProgressNotifier;

        public audioContext: any;

        constructor() {
            this.audioContext = new (<any>window).AudioContext();
        }

        private loadingMessages: Array<string> = [
            "Fixing bugs",
            "Winning Imagine Cup 2014",
            "Thinking of funny text to put here",
        ];

        private onContentLoaded(path: string, object: any) {
            this.loaded++;
            this.loadedContent[path] = object;

            if (this.progressNotifier) {
                var randomIndex = ~~(Math.random() * (this.loadingMessages.length - 1));
                this.progressNotifier.update(this.loaded / this.totalQueuedItems, this.loadingMessages[randomIndex]);
            }

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
            if (this.audioContext.isDummy) {
                this.loaded--;
                this.onContentLoaded(soundName, () => {
                    return {
                        buffer: "Web Audio not supported",
                        volume: volume
                    };
                });
                return;
            }

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

            loader.load(path, (geometry, materials) => {
                geometry.computeFaceNormals();
                geometry.computeVertexNormals();

                var material: THREE.MeshBasicMaterial = <any> (materials.length == 1 ? materials[0] : new THREE.MeshFaceMaterial(materials));

                var duplicate = () => {
                    var mesh = new THREE.Mesh(geometry, material);
                    mesh.name = path;
                    return mesh;
                }
                this.onContentLoaded(path, duplicate);
            });
        }

        private loadAnimationData(path: string): void {
            this.ajaxLoad(path, (xhr: XMLHttpRequest) => {
                var animDescription = eval("Object(" + xhr.responseText + ")");
                var animationData = animDescription;

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

                for (var i = 0; i < materials.length; i++) {

                    var m = <any> materials[i];
                    m.skinning = true;
                    m.ambient.copy(m.color);

                    m.wrapAround = true;
                    m.perPixel = true;
                }
                var material: THREE.MeshBasicMaterial = <any> (materials.length == 1 ? materials[0] : new THREE.MeshFaceMaterial(materials));

                var duplicate = () => {
                    var mesh = new THREE.SkinnedMesh(geometry, material);
                    mesh.name = path;
                    return mesh;
                };
                this.onContentLoaded(path, duplicate);
            });
        }

        private parsePhysics(physicsDescription: any): void {
            physicsDescription.friction = physicsDescription.friction || 1;
            physicsDescription.restitution = physicsDescription.restitution || 0;
            physicsDescription.gravity = physicsDescription.gravity || -9.82;
            physicsDescription.linearDamping = physicsDescription.linearDamping || 0;
            physicsDescription.angularDamping = physicsDescription.angularDamping || 0;

            PhysicsManager.instance.updatePhysicsSettings(physicsDescription);
        }

        private parseSettings(worldDescription: any): void {
            // Physics first!
            this.parsePhysics(worldDescription.physics);
            var settings = worldDescription.settings;

            var controllerSettings = worldDescription.controller;
            if (!controllerSettings.angularSpeed) {
                throw new Error("Some or all of character controller settings are missing!");
            }

            Thralldom.CameraControllers.SkyrimCameraController.defaultSettings = controllerSettings;

            var characterSettings = worldDescription.character;
            Thralldom.Character.Settings = characterSettings;
        }

        private loadLights(worldDescription: any, world: Thralldom.World): void {
            var lightsDescription = worldDescription.lights;

            for (var i = 0; i < lightsDescription.length; i++) {
                var descriptor = lightsDescription[i];
                var light: THREE.Light;
                switch (descriptor.type) {
                    case "ambient":
                        light = new THREE.AmbientLight(descriptor.color);
                        break;
                    case "directional":
                        light = new THREE.DirectionalLight(descriptor.color, descriptor.intensity);
                        var pos = descriptor.position;
                        light.position.set(pos[0], pos[1], pos[2]);
                        break;
                };
                world.renderScene.add(light);
            }
        }

        private parseCollection(collectionDescription: Array<any>, typeMapping: any, callback: (instance: ILoadable) => void): void {
            for (var i = 0; i < collectionDescription.length; i++) {
                var object = collectionDescription[i];
                var type = typeMapping[object.type.toLowerCase()];
                if (type) {
                    var instance = new type();
                    instance.loadFromDescription(object, this);
                    callback(instance);
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

        private loadControllers(world: Thralldom.World, graph: Algorithms.IGraph): void {
            world.controllerManager.graph = graph;

            for (var typeName in ContentManager.controllerTypes) {
                var type = ContentManager.controllerTypes[typeName];

                var controllers = <Array<IController>> world.selectByTag(typeName).map((character) => new type(character, graph));
                world.controllerManager.controllers = world.controllerManager.controllers.concat(controllers);
            }
        }

        private parseWorld(path: string, worldDescription: any): Thralldom.World {

            var world = new World();
            // Settings first
            this.parseSettings(worldDescription);

            // Lights
            this.loadLights(worldDescription, world);

            // Dynamics / statics
            this.parseCollection(worldDescription.dynamics, ContentManager.dynamicTypes, world.addDynamic.bind(world));
            this.parseCollection(worldDescription.statics, ContentManager.staticTypes, world.addStatic.bind(world));

            // Singletons
            var singletons = [];
            this.tryAddSingletonDescription(singletons, worldDescription, "skybox");
            this.tryAddSingletonDescription(singletons, worldDescription, "terrain");
            this.parseCollection(singletons, ContentManager.staticTypes, world.addStatic.bind(world));

            // Waypoints
            if (!worldDescription.waypoints) {
                console.error("No pathfinding graph supplied to scene, AI cannot move!");
            }

            var graph = {
                nodes: worldDescription.waypoints.nodes.map((array) => new Algorithms.Vertex(array[0], array[1])),
                edges: worldDescription.waypoints.edges.map((array) => new Algorithms.Edge(array[0], array[1])),
            }

            this.loadControllers(world, graph);

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

        private loadItemDb(path: string): void {
            this.ajaxLoad(path, (xhr: XMLHttpRequest) => {
                var items = eval(xhr.responseText);
                var inventory = new Inventory();
                inventory.loadFromDescription(items, this);
                this.onContentLoaded(SpecialContents.Items, () => inventory);
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

                this.totalQueuedItems += this.loading;
            }, false);
        }


        public loadMeta(path: string, callback: (meta: IMetaGameData) => void): IProgressNotifier {
            this.progressNotifier = {
                update: function () { }
            }

            this.ajaxLoad(path, (xhr: XMLHttpRequest) => {

                var meta: IMetaGameData = eval("Object(" + xhr.responseText + ")");

                if (!meta.world) {
                    throw new Error("Must provide a World!");
                }
                if (!meta.quest) {
                    throw new Error("Must provide a quest!");
                }

                // Compute the total number of items we are to load
                this.totalQueuedItems = 1 /* world */ + 1 /* quest */ + 1 /* itemdb */ + meta.scripts.length; /* scripts */

                this.loadAssets(meta.assets);

                this.onLoaded = () => {
                    // Once all the assets have been loaded, load the world and quests since they depend on the assets
                    this.loadWorld(meta.world);
                    this.loadQuest(meta.quest);
                    this.loadItemDb(meta.items);
                    for (var i = 0; i < meta.scripts.length; i++) {
                        this.loadScript(meta.scripts[i]);
                    }


                    this.onLoaded = () => {
                        this.onContentLoaded(path, () => meta);
                        callback(meta);
                    }
                };
            }, false);

            return this.progressNotifier;
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
                throw new Error("Content {0} not loaded".format(path));
            }
        }
    }
} 