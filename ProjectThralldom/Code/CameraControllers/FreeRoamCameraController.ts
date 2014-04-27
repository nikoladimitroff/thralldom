module Thralldom {
    export module CameraControllers {
        export class FreeRoamCameraController implements ICameraController {

            public ignoreInput: boolean;
            public camera: THREE.PerspectiveCamera;
            public zoomSpeed: number;

            public hero: Character;
            public distance: number;
            public yaw: number;
            public pitch: number;

            public get position() {
                return this.camera.position;
            }

            public static defaultSettings: IControllerSettings;

            private settings: IControllerSettings;

            constructor(aspectRatio: number, camSpeed: number, hero: Character, distance: number, startPos: THREE.Vector3 = Const.ZeroVector) {
                this.camera = new THREE.PerspectiveCamera(60, aspectRatio, 1, 100000);

                this.hero = hero;
                this.distance = distance;
                this.zoomSpeed = camSpeed;
                this.yaw = 0;
                this.pitch = 0;

                this.settings = SkyrimCameraController.defaultSettings;

                this.camera.position.copy(startPos);
                var target = (new THREE.Vector3()).addVectors(this.camera.position, Const.ForwardVector);
                this.camera.lookAt(target);
            }

            private handleMouseClick(delta: number, input: InputManager): void {
                var forward = new THREE.Vector3(0, 0, -1);
                forward.transformDirection(this.camera.matrix).multiplyScalar(2);
                if (input.mouse.leftButton) {
                    this.camera.position.add(forward);
                }

                if (input.mouse.rightButton) {
                    this.camera.position.sub(forward);
                }
            }

            public handleMouse(delta: number, input: InputManager): void {
                if (this.ignoreInput) return;

                this.handleMouseClick(delta, input);

                var movement = new THREE.Vector3;
                movement.y = (input.mouse.relative.x) * delta;
                movement.x = (input.mouse.relative.y) * delta;
                var speed = delta * this.settings.angularSpeed;

                // TODO: replace magic numbers! 
                var turnSpeed = movement.y * speed;
                this.yaw -= turnSpeed
                this.pitch = THREE.Math.clamp(this.pitch - movement.x * speed, THREE.Math.degToRad(-179), THREE.Math.degToRad(179));

                var yaw = (new THREE.Quaternion()).setFromAxisAngle(Const.UpVector, this.yaw);
                var pitch = (new THREE.Quaternion()).setFromAxisAngle(Const.RightVector, this.pitch);
                var roll = (new THREE.Quaternion()).setFromAxisAngle(Const.ForwardVector, 0);
                this.camera.quaternion.set(0, 0, 0, 1).multiply(yaw).multiply(pitch).multiply(roll);
            }

            handleKeyboard(delta: number, input: InputManager, keybindings: CharacterControllers.IKeybindings): void {
                if (this.ignoreInput) return;
            }
        }
    }
} 