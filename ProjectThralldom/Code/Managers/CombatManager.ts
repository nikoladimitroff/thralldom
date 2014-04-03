module Thralldom {
    export class CombatManager {

        public hero: Character;
        public world: Thralldom.World;
        public enemies: Array<Character>;

        constructor(world: Thralldom.World, hero: Character, enemies: Array<Character>) {
            this.world = world;
            this.hero = hero;
            this.enemies = enemies;
        }

        private addTrajectoryLine(worldFrom: THREE.Vector3, worldTo: Ammo.btVector3, color: number): void {
            var lineGeom = new THREE.Geometry();
            lineGeom.vertices.push(worldFrom);
            lineGeom.vertices.push(new THREE.Vector3(worldTo.x(), worldTo.y(), worldTo.z()));

            var line = new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: color }));
            line.name = "debug";
            this.world.renderScene.add(line);
        }

        public update(debugDraw: boolean): FrameInfo {
            var heroCollisionObject: Ammo.btCollisionObject = null;

            if (this.hero.weapon.attackWaiting) {
                var worldFrom = this.hero.weapon.attackWorldFrom;
                var worldTo = this.hero.weapon.attackForward.multiplyScalar(this.hero.range).add(worldFrom);
                var raycast = this.world.physicsManager.raycast(worldFrom, worldTo);
                heroCollisionObject = raycast.get_m_collisionObject();

                if (debugDraw && raycast.hasHit()) {
                    this.addTrajectoryLine(worldFrom, raycast.get_m_hitPointWorld(), 0x0000FF);
                }
            }

            for (var i = 0; i < this.enemies.length; i++) {
                // See if the enemy has attacked and hit something
                if (this.enemies[i].weapon.attackWaiting) {
                    var worldFrom = this.enemies[i].weapon.attackWorldFrom;
                    var worldTo = this.enemies[i].weapon.attackForward;
                    worldTo.multiplyScalar(this.enemies[i].range).add(worldFrom);
                    var raycast = this.world.physicsManager.raycast(worldFrom, worldTo);
                    if (raycast.hasHit()) {
                        var collisionObject = raycast.get_m_collisionObject();
                        if (this.hero.rigidBody.a == collisionObject.a) {
                            this.hero.health -= this.enemies[i].damage;
                        }

                        if (debugDraw) {
                            this.addTrajectoryLine(worldFrom, raycast.get_m_hitPointWorld(), 0xFF0000);
                        }
                    }
                }
                // See if the enemy himself was hit by the hero
                if (heroCollisionObject && this.enemies[i].rigidBody.a == heroCollisionObject.a) {
                    this.enemies[i].health -= this.hero.damage;
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