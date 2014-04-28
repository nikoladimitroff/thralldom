module Thralldom {
    export class AudioManager {
        private _masterVolume: number;

        public get masterVolume(): number {
            return this._masterVolume;
        }

        public set masterVolume(volume: number) {
            this._masterVolume = volume;
            for (var sound in this.active) {
                for (var id in this.active[sound]) {
                    var audio = <THREE.AudioObject> this.active[sound][id];
                    if (audio) {
                        var audioData = this.content.getContent(sound);
                        audio.setVolume(audioData.volume * volume);
                    }
                }
            }
        }

        private static _instance: AudioManager;
        public static get instance(): AudioManager {
            return AudioManager._instance;
        }

        private static AUDIO_RADIUS = 200;

        private context: any;

        private active: IIndexable<INumberIndexable<THREE.AudioObject>>;
        private silent: IIndexable<INumberIndexable<THREE.AudioObject>>;

        private isDisabled: boolean = false;

        private content: ContentManager;
        constructor(content: ContentManager) {
            this.content = content;
            AudioManager._instance = this;

            this.context = content.audioContext;
            if (this.context.isDummy) {
                this.isDisabled = true;
            }

            this.active = <IIndexable<INumberIndexable<THREE.AudioObject>>> {};
            this.silent = <IIndexable<INumberIndexable<THREE.AudioObject>>> {};
            this.masterVolume = 1;
        }

        public playSound(sound: string, object: THREE.Object3D, loop: boolean, isDirectional: boolean): void {
            if (this.isDisabled) return;

            if (!this.active[sound]) {
                this.active[sound] = {};
            }

            // If there already is an active sound, do nothing
            var activeAudio = this.active[sound][object.id];
            if (!activeAudio) {
                var audioOptions = this.content.getContent(sound);
                var newAudio = new THREE.AudioObject(this.context, audioOptions.buffer, audioOptions.volume * this.masterVolume, loop, isDirectional);
                object.add(newAudio);

                // Finally, play the sound
                newAudio.play();
                this.active[sound][object.id] = newAudio;
            }
        }

        public stopSound(sound: string, objectId: number): void {
            if (this.isDisabled) return;

            var audio = <THREE.AudioObject> this.active[sound][objectId];
            if (audio) {
                audio.stop();
                // Destroy the (last) reference to the audio object
                this.active[sound][objectId] = null;
                audio.parent.remove(audio);
            }
        }

        public hasFinished(sound: string, object: THREE.Object3D): boolean {
            if (this.isDisabled) return true;

            return this.active[sound][object.id] == undefined;
        }

        public update(camera: THREE.Camera): void {
            if (this.isDisabled) return;

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