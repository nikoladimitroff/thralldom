module Thralldom {
    export module CameraControllers {
        export class SkyrimCameraController implements ICameraController {

            public camera: THREE.PerspectiveCamera;
            public cameraSpeed: number;

            public hero: ISelectableObject;
            public distance: number;
            public bias: THREE.Vector3;
            public yaw: number;
            public pitch: number;
            public skybox: Skybox;

            constructor(aspectRatio: number, camSpeed: number, hero: ISelectableObject, distance: number, bias: THREE.Vector3, skybox: Skybox) {
                this.camera = new THREE.PerspectiveCamera(60, aspectRatio, 1, 10000);
                this.hero = hero;
                this.distance = distance;
                this.bias = bias;
                this.cameraSpeed = camSpeed;
                this.yaw = 0;
                this.pitch = Math.PI / 2;


                this.skybox = skybox;

                this.camera.position.y = 20;

            }

            private fixPosition(): void {
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

                var target = new THREE.Vector3();
                target.add(this.hero.mesh.position);
                // The camera should look a little bit over him (2.25 looks good)
                target.y += 2.25 * midY;
                this.camera.lookAt(target);
            }

            public handleMouseRotation(delta: number, input: InputManager): void {

                delta *= 0.01;
                var movement = new THREE.Vector3;
                movement.y = (input.mouse.relative.x) * delta;
                movement.x = (input.mouse.relative.y) * delta;
                movement.z = (input.mouse.scroll - input.previousMouse.scroll) / 120;

                // TODO: replace magic numbers! 
                this.distance -= movement.z * this.cameraSpeed;
                this.yaw += movement.y * 10 * Math.PI;
                this.pitch = THREE.Math.clamp(this.pitch + movement.x * 10 * Math.PI, THREE.Math.degToRad(75), THREE.Math.degToRad(150));
                this.hero.mesh.rotation.y = this.yaw;

                this.hero.rigidBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), this.yaw);
                this.bias.y += 0//movement.x * 100;

                this.fixPosition();
            }

            private previousKeepPlaying: boolean;
            private previousHandler = {
                translate: 0,
                hero: null,
            };
            public handleKeyboardHeroMovement(delta: number, input: InputManager, hero: Character, keybindings: IKeybindings): void {
                delta *= 10;
                
                if (input.keyboard[keybindings.moveForward]) {
                    //hero.mesh.translateZ(2 * delta);
                    //var vel = (<any> hero.rigidBody).velocity;
                    //vel.z += 2 * delta;
                    
                    var forward = new THREE.Vector3(0, 0, 1);
                    forward.transformDirection(hero.mesh.matrix).multiplyScalar(2 * delta);
                    hero.rigidBody.position.vadd(forward, hero.rigidBody.position);
                    //hero.rigidBody.velocity.vadd(forward, hero.rigidBody.velocity);


                    this.skybox.mesh.position.add(forward);
                    if (!this.previousKeepPlaying) {
                        hero.animation.play();
                    }
                    this.previousHandler.translate = 2 * delta;
                    this.previousHandler.hero = hero;
                    hero.keepPlaying = true;
                }
                if (input.keyboard[keybindings.strafeLeft]) {
                   // hero.mesh.translateX(1 * delta);
                }
                if (input.keyboard[keybindings.strafeRight]) {
                   // hero.mesh.translateX(-1 * delta);
                }
                if (input.keyboard[keybindings.moveBackward]) {
                    hero.mesh.translateZ(-1 * delta);
                    hero.keepPlaying = true;
                }

                this.previousKeepPlaying = hero.keepPlaying;
            }

            public undoKeyboardHeroMovement(): void {
               // this.previousHandler.hero.rigidBody.velocity.z -= this.previousHandler.translate;
            }
        }
    }
} 