declare module THREE {
    export class EffectComposer {
        constructor(renderer: THREE.Renderer);
        addPass(effect: IEffect): void;
        render(): void;
    }

    export interface IEffect {
        renderToScreen: boolean;
    }

    export class RenderPass implements IEffect {
        renderToScreen: boolean;
        constructor(scene: THREE.Scene, camera: THREE.Camera);
    }

    export class ShaderPass implements IEffect, THREE.Shader {
        renderToScreen: boolean;
        uniforms: Uniforms;
        vertexShader: string;
        fragmentShader: string;
        constructor(shader: THREE.Shader);
    }

    export class BloomPass implements IEffect {
        renderToScreen: boolean;
        constructor(strength?: number, kernelSize?: number, sigma?: number, resolution?: number);
    }

    export var HorizontalTiltShiftShader: THREE.Shader;
    export var VerticalTiltShiftShader: THREE.Shader
    export var DotScreenShader: THREE.Shader;
    export var RGBShiftShader: THREE.Shader;
    export var SepiaShader: THREE.Shader;
    export var FilmShader: THREE.Shader;
    export var VignetteShader: THREE.Shader;
    export var SSAOShader: THREE.Shader;
    export var ColorCorrectionShader: THREE.Shader;
}