module Thralldom {
    export class CombatManager {

        public hero: Character;
        public world: Thralldom.World;
        public physics: Thralldom.PhysicsManager;
        public enemies: Array<Character>;

        private raycastUids: Array<number>;

        constructor(world: Thralldom.World, physics: PhysicsManager, hero: Character, enemies: Array<Character>) {
            this.world = world;
            this.physics = physics;
            this.hero = hero;
            this.enemies = enemies;

            // An map from character index(0 for #hero) to their raycasts
            this.raycastUids = [-1];
        }

        private addTrajectoryLine(worldFrom: THREE.Vector3, worldTo: THREE.Vector3, color: number): void {
            var lineGeom = new THREE.Geometry();
            lineGeom.vertices.push(worldFrom);
            lineGeom.vertices.push(new THREE.Vector3(worldTo.x, worldTo.y, worldTo.z));

            var line = new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: color }));
            line.name = "debug";
            this.world.renderScene.add(line);
        }

        public update(debugDraw: boolean): FrameInfo {
            var heroCollisionObjectId: number = -1;

            var ray = this.physics.tryResolveRaycast(this.raycastUids[0]);
            if (ray) {
                heroCollisionObjectId = ray.collisionObjectId;
                this.raycastUids[0] = -1;
                if (debugDraw && ray.hasHit) {
                    var from = this.hero.mesh.position;
                    console.log(ray.hitPoint);
                    var line = GeometryUtils.getTrajectoryLine(from, <any>ray.hitPoint, 0x0000FF);
                    this.world.renderScene.add(line);
                }
            }

            if (this.hero.weapon.attackWaiting && this.raycastUids[0] == -1) {
                var worldFrom = this.hero.weapon.attackWorldFrom;
                var worldTo = this.hero.weapon.attackForward.multiplyScalar(this.hero.range).add(worldFrom);
                this.raycastUids[0] = this.physics.requestRaycast(worldFrom, worldTo);
            }

            for (var i = 0; i < this.enemies.length; i++) {
                if (this.raycastUids[i + 1] != -1) {
                    var ray = this.physics.tryResolveRaycast(this.raycastUids[i + 1]);
                    if (ray) {
                        if (ray.hasHit) {
                            var collisionObjectId = ray.collisionObjectId;
                            if (this.hero.mesh.id == collisionObjectId) {
                                this.hero.health -= this.enemies[i].damage;
                            }
                            if (debugDraw) {
                                var from = this.enemies[i].mesh.position;
                                this.addTrajectoryLine(from, <any>ray.hitPoint, 0xFF0000);
                            }
                        }
                        this.raycastUids[i + 1] = -1;
                    }
                }


                // See if the enemy himself was hit by the hero
                if (this.enemies[i].mesh.id == heroCollisionObjectId) {
                    this.enemies[i].health -= this.hero.damage;
                } 

                // See if the enemy has attacked 
                if (this.enemies[i].weapon.attackWaiting) {
                    var worldFrom = this.enemies[i].weapon.attackWorldFrom;
                    var worldTo = this.enemies[i].weapon.attackForward;
                    worldTo.multiplyScalar(this.enemies[i].range).add(worldFrom);
                    // There's a small chance this causes a MEMLEAK
                    this.raycastUids[i + 1] = this.physics.requestRaycast(worldFrom, worldTo);
                }
            }

            var frameInfo = new FrameInfo(this.world, this.hero, []);
            // Reverse loop so that we can remove elements from the array.
            for (var i = this.enemies.length - 1; i > - 1; i--) {
                if (this.enemies[i].health <= 0) {
                    frameInfo.killedEnemies.push(this.enemies[i]);

                    this.enemies[i].stateMachine.requestTransitionTo(CharacterStates.Dying);
                    this.enemies.splice(i, 1);
                }
            }
            return frameInfo;
        }
    }
}