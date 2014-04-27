module Thralldom {
    export class ParticleManager {
        private engines: Array<THREE.ParticleEngine>;

        constructor() {
        }

        public load(world: Thralldom.World, pos: THREE.Vector3, terrainSize: number): void {
            // Do nothing nao
            return;

            var rain = new THREE.ParticleEngine();
            var params = THREE.ParticleEngineExamples.rain;
            // MAGIC NUMBER, Rain over 1 / 15 of the terrain centered around our character looks good
            params.positionSpread.x = params.positionSpread.z = terrainSize / 15;
            rain.setValues(THREE.ParticleEngineExamples.rain);
            rain.initialize();

            rain.particleMesh.position.copy(pos);
            world.renderScene.add(rain.particleMesh);


            var fireflies = new THREE.ParticleEngine();
            var params = THREE.ParticleEngineExamples.fireflies;
            params.positionSpread.x = params.positionSpread.z = terrainSize;
            fireflies.setValues(params);
            fireflies.initialize();
            fireflies.particleMesh.position.copy(pos);
            world.renderScene.add(fireflies.particleMesh);


            this.engines = [rain, fireflies];
        }

        public update(delta): void {
            return;
            for (var i = 0; i < this.engines.length; i++) {
                this.engines[i].update(delta * 0.5);
            }
        }

    }
} 