module Thralldom {
    export class ParticleManager {
        private engines: Array<THREE.ParticleEngine>;
        public terrainSize: number;
        private scene: THREE.Scene;
        private pos: THREE.Vector3;

        constructor(scene: THREE.Scene, pos: THREE.Vector3, terrainSize: number) {
            this.terrainSize = terrainSize;
            this.scene = scene;
            this.pos = pos;
        }

        public load(): void {
            var rain = new THREE.ParticleEngine();
            var params = THREE.ParticleEngineExamples.rain;
            // MAGIC NUMBER, Rain over 1 / 15 of the terrain centered around our character looks good
            params.positionSpread.x = params.positionSpread.z = this.terrainSize / 15;
            rain.setValues(THREE.ParticleEngineExamples.rain);
            rain.initialize();

            rain.particleMesh.position.copy(this.pos);
            this.scene.add(rain.particleMesh);


            var fireflies = new THREE.ParticleEngine();
            var params = THREE.ParticleEngineExamples.fireflies;
            params.positionSpread.x = params.positionSpread.z = this.terrainSize;
            fireflies.setValues(params);
            fireflies.initialize();
            fireflies.particleMesh.position.copy(this.pos);
            this.scene.add(fireflies.particleMesh);

            this.engines = [rain, fireflies];
        }

        public update(delta): void {
            if (this.engines) {
                for (var i = 0; i < this.engines.length; i++) {
                    this.engines[i].update(delta * 0.5);
                }
            }
        }

        public destroy(): void {
            for (var i = 0; i < this.engines.length; i++) {
                this.scene.remove(this.engines[i].particleMesh);
            }
            this.engines = null;
        }

    }
} 