module Thralldom {
    export module CameraControllers {
        export class ThirdPersonLockCameraController implements ICameraController {

            public camera: THREE.Camera;

            public target: THREE.Object3D;
            public distance: number;
            public bias: THREE.Vector3;


            constructor(camera: THREE.Camera, target: THREE.Object3D, distance: number, bias: THREE.Vector3) {
                this.camera = camera;
                this.target = target;
                this.distance = distance;
                this.bias = bias;

            }

            public update(delta: number): void {

                // Get the -z direction of the target, multiply it by the distnace
                var cameraToCharacter = new THREE.Vector3(0, 0, 1);
                cameraToCharacter.transformDirection(this.target.matrix).multiplyScalar(-this.distance);
                cameraToCharacter.add(this.bias);

                cameraToCharacter.add(this.target.position);
                this.camera.position.copy(cameraToCharacter);

                this.camera.lookAt(this.target.position);

            }
        }
    }
} 