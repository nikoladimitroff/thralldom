declare module THREE {
    export class ParticleEngine {
        particleMesh: ParticleSystem;
        setValues(values: IParticleEngineParameters): void;
        initialize(): void;
        update(delta: number): void;
        destroy(): void;
    }

    export var ParticleEngineExamples: {
        fountain: IParticleEngineParameters;
        fireball: IParticleEngineParameters;
        smoke: IParticleEngineParameters;
        clouds: IParticleEngineParameters;
        snow: IParticleEngineParameters;
        rain: IParticleEngineParameters;
        starfield: IParticleEngineParameters;
        fireflies: IParticleEngineParameters;
        startunnel: IParticleEngineParameters;
        firework: IParticleEngineParameters;
        candle: IParticleEngineParameters;
    }

    export class Tween {
        constructor(timeArray: Array<number>, valueArray: Array<any>);
    }

    export enum Type {
        CUBE,
        SPHERE,
    }

    export interface IParticleEngineParameters {
        positionBase: Vector3;
        positionStyle: Type;

        // for Type.CUBE
        positionSpread: Vector3;

        // for Type.SPHERE
        positionRadius: number;

        velocityStyle: Type;

        // for Type.CUBE
        velocityBase: Vector3;
        velocitySpread: Vector3;

        // for Type.SPHERE
        speedBase: number;
        speedSpread: number;

        accelerationBase: Vector3;
        accelerationSpread: Vector3;

        particleTexture: Texture;

        // rotation of image used for particles
        angleBase: number;
        angleSpread: number;
        angleVelocityBase: number;
        angleVelocitySpread: number;
        angleAccelerationBase: number;
        angleAccelerationSpread: number;

        // size, color, opacity 
        //   for static  values, use base/spread
        //   for dynamic values, use Tween
        //   (non-empty Tween takes precedence)
        sizeBase: number;
        sizeSpread: number;
        sizeTween: Tween;

        // colors stored in Vector3 in H,S,L format
        colorBase: Vector3;
        colorSpread: Vector3;
        colorTween: Tween;

        opacityBase: number;
        opacitySpread: number;
        opacityTween: Tween;

        blendStyle: THREE.Blending;

        particlesPerSecond: number;
        particleDeathAge: number;
        emitterDeathAge: number;
    }
}