module Thralldom {
    export module CameraControllers {
        export class SmartCameraController implements ICameraController {
            
            public camera: THREE.Camera;

            public target: THREE.Object3D;
            public distance: number;
            public bias: THREE.Vector3;


            constructor(camera: THREE.Camera, target: THREE.Object3D, distance: number, bias: THREE.Vector3) {
                this.camera = camera;
                this.target = target;
                this.distance = distance;
                this.bias = bias;

                throw new Error("not implemented");

            }

            public update(delta: number): void {
                //this.camera.lookAt(this.target.position);
            }
        }
    }
}  