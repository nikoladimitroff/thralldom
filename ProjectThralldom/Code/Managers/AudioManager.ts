module Thralldom {
    export class AudioManager {


        private static _instance: AudioManager;
        public static get instance(): AudioManager {
            return AudioManager._instance;
        }

        private static AUDIO_RADIUS = 200;

        private context: any;

        private active: Map<string, Map<number, THREE.AudioObject>>;
        private silent: Map<string, Map<number, THREE.AudioObject>>;

        private content: ContentManager;
        constructor(content: ContentManager) {
            this.content = content;
            AudioManager._instance = this;

            this.context = content.audioContext;

            this.active = <Map<string, Map<number, THREE.AudioObject>>> {};
            this.silent = <Map<string, Map<number, THREE.AudioObject>>> {};
        }

        public playSound(sound: string, object: THREE.Object3D, loop: boolean, isDirectional: boolean): void {
            if (!this.active[sound]) {
                this.active[sound] = {};
            }

            // If there already is an active sound, do nothing
            var activeAudio = this.active[sound][object.id];
            if (!activeAudio) {
                var audioOptions = this.content.getContent(sound);
                var newAudio = new THREE.AudioObject(this.context, audioOptions.buffer, audioOptions.volume, loop, isDirectional);
                object.add(newAudio);

                // Finally, play the sound
                newAudio.play();
                this.active[sound][object.id] = newAudio;
            }
        }

        public stopSound(sound: string, objectId: number): void {
            var audio = <THREE.AudioObject> this.active[sound][objectId];
            if (audio) {
                audio.stop();
                // Destroy the (last) reference to the audio object
                this.active[sound][objectId] = null;
                audio.parent.remove(audio);
            }
        }

        public hasFinished(sound: string, object: THREE.Object3D): boolean {
            return this.active[sound][object.id] == undefined;
        }

        public update(camera: THREE.Camera): void {
            for (var sound in this.active) {
                for (var id in this.active[sound]) {
                    var audio = <THREE.AudioObject> this.active[sound][id];
                    if (audio) {
                        audio.update(camera);
                        if (audio.hasFinished()) {
                            this.stopSound(sound, id);
                        }
                    }
                }
            }
        }
    }
} 