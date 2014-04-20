module Thralldom {
    export class CombatManager {

        public hero: Character;
        public world: Thralldom.World;
        public enemies: Array<Character>;

        private raycastUids: Array<number>;

        constructor(world: Thralldom.World, hero: Character, enemies: Array<Character>) {
            this.world = world;
            this.hero = hero;
            this.enemies = enemies;

            this.raycastUids = new Array<number>();
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

            if (this.hero.weapon.attackWaiting) {

                var ray = this.world.tryResolveRaycast(this.raycastUids[0]);
                if (this.raycastUids[0] == -1) {

                    var worldFrom = this.hero.weapon.attackWorldFrom;
                    var worldTo = this.hero.weapon.attackForward.multiplyScalar(this.hero.range).add(worldFrom);
                    this.raycastUids[0] = this.world.requestRaycast(worldFrom, worldTo);
                }

                if (ray) {
                    heroCollisionObjectId = ray.collisionObjectId;
                    if (debugDraw && ray.hasHit) {
                        this.addTrajectoryLine(worldFrom, <any>ray.hitPoint, 0x0000FF);
                    }
                    this.raycastUids[0] = -1;
                }
            }

            for (var i = 0; i < this.enemies.length; i++) {
                if (this.raycastUids[i + 1] != -1) {
                    var ray = this.world.tryResolveRaycast(this.raycastUids[i + 1]);
                    if (ray) {
                        if (ray.hasHit) {
                            var collisionObjectId = ray.collisionObjectId;
                            if (this.hero.mesh.id == collisionObjectId) {
                                this.hero.health -= this.enemies[i].damage;
                            }

                            if (debugDraw) {
                                this.addTrajectoryLine(worldFrom, <any>ray.hitPoint, 0xFF0000);
                            }
                        }
                        if (ray) {
                            this.raycastUids[i + 1] = -1;
                        }
                    }
                }


                // See if the enemy himself was hit by the hero
                if (this.enemies[i].mesh.id == heroCollisionObjectId) {
                    this.enemies[i].health -= this.hero.damage;
                } 

                // See if the enemy has attacked and hit something
                if (this.enemies[i].weapon.attackWaiting) {
                    var worldFrom = this.enemies[i].weapon.attackWorldFrom;
                    var worldTo = this.enemies[i].weapon.attackForward;
                    worldTo.multiplyScalar(this.enemies[i].range).add(worldFrom);
                    // There's a small chance this causes a MEMLEAK
                    this.raycastUids[i + 1] = this.world.requestRaycast(worldFrom, worldTo);
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