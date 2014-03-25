declare module THREE {
    export class AudioObject extends Object3D {
        constructor(audioContext: any, buffer: any, volume: number, loop: boolean, isDirectional: boolean);
        setVolume(volume: number): void;
        update(camera: THREE.Camera): void;
        play(): void;
        stop(): void;
        hasFinished(): boolean;
    }
}