module Thralldom {
    export module CameraControllers {
        export class SkyrimCameraController implements ICameraController {

            public ignoreInput: boolean;
            public camera: THREE.PerspectiveCamera;
            public zoomSpeed: number;

            public hero: Character;
            public distance: number;
            public bias: THREE.Vector3;
            public yaw: number;
            public pitch: number;

            public get position() {
                return this.camera.position;
            }

            public static defaultSettings: IControllerSettings;

            private settings: IControllerSettings;

            constructor(aspectRatio: number, camSpeed: number, hero: Character, distance: number, bias: THREE.Vector3) {
                this.camera = new THREE.PerspectiveCamera(60, aspectRatio, 1, 100000);

                this.hero = hero;
                this.distance = distance;
                this.bias = bias;
                this.zoomSpeed = camSpeed;
                this.yaw = 0;
                this.pitch = Math.PI / 2;

                this.settings = SkyrimCameraController.defaultSettings;
            }

            private getTarget() {
                var mesh = this.hero.mesh;
                var midY = mesh.scale.y * (mesh.geometry.boundingBox.max.y - mesh.geometry.boundingBox.min.y) / 2;
                var target = new THREE.Vector3();
                target.add(this.hero.mesh.position);
                // The camera should look a little bit over him (2.25 looks good)
                target.y += 2.25 * midY;

                return target;
            }

            private normalizePosition(): void {
                // Standard sphere equation
                var cameraToCharacter = new THREE.Vector3(
                    Math.sin(this.yaw) * Math.sin(this.pitch),
                    Math.cos(this.pitch),
                    Math.cos(this.yaw) * Math.sin(this.pitch));

                // Multiply by the -distance to make the camera face +z and place the point at radius distance
                cameraToCharacter.multiplyScalar(-this.distance);
                cameraToCharacter.add(this.bias);

                // Find the bounding box around our character. The camera's y must be equal to midY
                var mesh = (<THREE.Mesh>this.hero.mesh);
                mesh.geometry.computeBoundingBox();
                var midY = mesh.scale.y * (mesh.geometry.boundingBox.max.y - mesh.geometry.boundingBox.min.y) / 2;

                // Center the circles around the hero instead of (0, 0, 0)
                cameraToCharacter.add(this.hero.mesh.position).y += midY;
                this.camera.position.copy(cameraToCharacter);

                this.camera.lookAt(this.getTarget());
            }

            public handleMouse(delta: number, input: InputManager): void {
                if (this.ignoreInput) return;

                var movement = new THREE.Vector3;
                movement.y = (input.mouse.relative.x) * delta;
                movement.x = (input.mouse.relative.y) * delta;
                movement.z = input.mouse.scroll - input.previousMouse.scroll;
                var speed = delta * this.settings.angularSpeed;

                // TODO: replace magic numbers! 
                this.distance -= movement.z * this.zoomSpeed;
                this.distance = THREE.Math.clamp(this.distance, -28, 28);
                var turnSpeed = movement.y * speed; 
                this.yaw -= turnSpeed
                this.pitch = THREE.Math.clamp(this.pitch + movement.x * speed, THREE.Math.degToRad(75), THREE.Math.degToRad(150));

                if (!this.hero.isDead)
                    this.hero.mesh.quaternion.setFromAxisAngle(Const.UpVector, this.yaw);

                this.normalizePosition();
            }


            handleKeyboard(delta: number, input: InputManager, keybindings: CharacterControllers.IKeybindings): void {

                if (this.ignoreInput) return;
            }
        }
    }
} 