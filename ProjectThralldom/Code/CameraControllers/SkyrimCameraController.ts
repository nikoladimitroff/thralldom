module Thralldom {
    export module CameraControllers {
        export class SkyrimCameraController implements ICameraController {

            public camera: THREE.Camera;
            public cameraSpeed: number;

            public target: THREE.Object3D;
            public distance: number;
            public bias: THREE.Vector3;
            public rotation: number;

            constructor(camera: THREE.Camera, camSpeed: number, target: THREE.Object3D, distance: number, bias: THREE.Vector3) {
                this.camera = camera;
                this.target = target;
                this.distance = distance;
                this.bias = bias;
                this.cameraSpeed = camSpeed;
                this.rotation = 0;

            }

            private fixPosition(): void {
                // Get the -z direction of the target, multiply it by the distnace
                var cameraToCharacter = new THREE.Vector3(Math.sin(this.rotation), 0, Math.cos(this.rotation));
                cameraToCharacter.multiplyScalar(-this.distance);
                cameraToCharacter.add(this.bias);

                cameraToCharacter.add(this.target.position);
                this.camera.position.copy(cameraToCharacter);

                this.camera.lookAt(this.target.position);
            }

            public handleMouseRotation(delta: number, input: InputManager): void {

                delta *= 25;
                var movement = new THREE.Vector3;
                movement.y = (input.mouse.ndc.x -  input.previousMouse.ndc.x) * delta;
                movement.x = (input.mouse.ndc.y -  input.previousMouse.ndc.y) * delta;
                movement.z = (input.mouse.scroll - input.previousMouse.scroll) / 120 * delta;

                // TODO: replace magic numbers! 
                this.distance -= movement.z * this.cameraSpeed;
                this.rotation += movement.y * 10 * Math.PI;
                this.bias.y += 0//movement.x * 100;

                this.fixPosition();
            }

            public handleKeyboardHeroMovement(delta: number, input: InputManager, hero: Character, keybindings: IKeybindings): void {
                delta *= 10;
                if (input.keyboard[keybindings.moveForward]) {
                    hero.mesh.rotation.y = this.rotation;
                    hero.mesh.translateZ(1 * delta);
                }
                if (input.keyboard[keybindings.strafeLeft]) {
                    hero.mesh.translateX(1 * delta);
                }
                if (input.keyboard[keybindings.strafeRight]) {
                    hero.mesh.translateX(-1 * delta);
                }
                if (input.keyboard[keybindings.moveBackward]) {
                    hero.mesh.rotation.y = Math.PI + this.rotation;
                    hero.mesh.translateZ(-1 * delta);
                }
            }
        }
    }
} 