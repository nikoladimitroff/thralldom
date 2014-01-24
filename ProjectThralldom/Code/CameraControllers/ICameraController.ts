module Thralldom {
    export module CameraControllers {
        export interface ICameraController {
            update(delta: number): void;
        }
    }
} 