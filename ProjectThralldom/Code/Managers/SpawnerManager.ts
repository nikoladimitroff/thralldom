module Thralldom {
    export class SpawnerManager implements ILoadable {
        private content: ContentManager;
        private spawners: Array<Spawner>;
        private world: Thralldom.World;
        private graph: Algorithms.IGraph;

        constructor(world: Thralldom.World, graph: Algorithms.IGraph) {
            this.spawners = new Array<Spawner>();
            this.world = world;
            this.graph = graph;
            //this.content = content;
            //var info:JSON = content.spawnerContext.getInfo();
            //console.log("SPAWNERCONTEXT: ", info);
        }

        public loadFromDescription(worldDescription: any, content: ContentManager): void {

            var components = worldDescription.components;

            for (var i = 0; i < components.length; i++) {
                var componentDescription = components[i];
                var maxUnits: number = componentDescription.maxUnits;
                //var character: Character = new Character();
                //character.loadFromDescription(componentDescription.character, content);
                console.log("spawners=", this.spawners);
                console.log("character=", componentDescription.character, maxUnits);
                var spawner: Spawner = new Spawner(componentDescription.character, maxUnits);
                this.spawners.push(spawner);
                //this.world.addDynamic(character);

                for(var i = 0; i < maxUnits; i++) {
                    var randomRect = Pathfinder.Graph.nodes[~~(Math.random() * Pathfinder.Graph.nodes.length)];
                    var randomPointInRect = GeometryUtils.randomPointInRect(randomRect);
                    var character: Character = new Character();
                    character.loadFromDescription(componentDescription.character, content);
                    character.mesh.position = new THREE.Vector3(randomPointInRect.x, 0, randomPointInRect.y);

                    if (character.tags.indexOf("guard") != -1) {
                        content.loadController("guard", this.world, this.graph);
                    }
                    else if (character.tags.indexOf("citizen") != -1) {
                        content.loadController("citizen", this.world, this.graph);
                    }
                    else if (character.tags.indexOf("statue") != -1) {
                        content.loadController("statue", this.world, this.graph);
                    }

                    this.world.addDynamic(character);
                }
            }
        }

        public addSpawner(instance: any): void {
            console.log("SpawnerManager.addSpawner:", instance, (typeof instance));
        }
    }
}