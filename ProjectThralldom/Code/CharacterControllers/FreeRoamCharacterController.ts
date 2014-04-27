module Thralldom {
    export module CharacterControllers {
        export class FreeRoamCharacterController implements ICharacterController {

            public camera: THREE.PerspectiveCamera;
            public zoomSpeed: number;

            public hero: Character;
            public distance: number;
            public bias: THREE.Vector3;
            public yaw: number;
            public pitch: number;
            public skybox: Skybox;

            public get position() {
                return this.camera.position;
            }

            public getTarget() {
                var mesh = this.hero.mesh;
                var midY = mesh.scale.y * (mesh.geometry.boundingBox.max.y - mesh.geometry.boundingBox.min.y) / 2;
                var target = new THREE.Vector3();
                target.add(this.hero.mesh.position);
                // The camera should look a little bit over him (2.25 looks good)
                target.y += 2.25 * midY;

                return target;
            }

            public static defaultSettings: IControllerSettings;

            private settings: IControllerSettings;

            constructor(aspectRatio: number, camSpeed: number, hero: Character, distance: number, bias: THREE.Vector3, skybox: Skybox) {
                this.camera = new THREE.PerspectiveCamera(60, aspectRatio, 1, 100000);

                this.hero = hero;
                this.distance = distance;
                this.bias = bias;
                this.zoomSpeed = camSpeed;
                this.yaw = 0;
                this.pitch = Math.PI / 2;


                this.skybox = skybox;


                this.settings = SkyrimCharacterController.defaultSettings;

                this.camera.position.y = 20;
                this.camera.lookAt(hero.mesh.position);
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
                this.handleMouseClick(delta, input);

                var movement = new THREE.Vector3;
                movement.y = (input.mouse.relative.x) * delta;
                movement.x = (input.mouse.relative.y) * delta;
                movement.z = input.mouse.scroll - input.previousMouse.scroll;
                var speed = delta * this.settings.angularSpeed;

                // TODO: replace magic numbers! 
                this.distance -= movement.z * this.zoomSpeed;
                var turnSpeed = movement.y * speed;
                this.yaw -= turnSpeed
                this.pitch = THREE.Math.clamp(this.pitch - movement.x * speed, THREE.Math.degToRad(-179), THREE.Math.degToRad(179));

                var yaw = (new THREE.Quaternion()).setFromAxisAngle(Const.UpVector, this.yaw);
                var pitch = (new THREE.Quaternion()).setFromAxisAngle(Const.RightVector, this.pitch);
                var roll = (new THREE.Quaternion()).setFromAxisAngle(Const.ForwardVector, 0);
                this.camera.quaternion.set(0, 0, 0, 1).multiply(yaw).multiply(pitch).multiply(roll);
            }

            private previousKeepPlaying: boolean;

            public handleKeyboard(delta: number, input: InputManager, keybindings: IKeybindings): void {
                var hero = this.hero;

                if (input.keyboard[keybindings.moveForward]) {
                    // If the sprint key is down, try to sprint
                    if (input.keyboard[keybindings.sprint]) {
                        hero.stateMachine.requestTransitionTo(CharacterStates.Sprinting)
                    }
                    // Otherwise just walk
                    else {
                        hero.stateMachine.requestTransitionTo(CharacterStates.Walking)
                    }
                }
                if (input.keyboard[keybindings.strafeLeft]) {
                    hero.mesh.quaternion.multiply((new THREE.Quaternion()).setFromAxisAngle(Const.UpVector, 0.2));
                }
                if (input.keyboard[keybindings.strafeRight]) {
                    hero.mesh.quaternion.multiply((new THREE.Quaternion()).setFromAxisAngle(Const.UpVector, -0.2));
                }
                if (input.keyboard[keybindings.moveBackward]) {

                }
                if (input.keyboard[keybindings.jump]) {
                }



                hero.stateMachine.requestTransitionTo(CharacterStates.Idle);
                // Update the state machine before trying to reset it back to falling / idle
                hero.stateMachine.states[hero.stateMachine.current].update(delta, hero);
            }
        }
    }
} 