module Thralldom {
    export module CharacterControllers {
        export class SkyrimCharacterController implements ICharacterController {

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

            private handleMouseClick(delta: number, input: InputManager): void {
                if (input.mouse.leftButton) {
                    if (!this.hero.stateMachine.requestTransitionTo(CharacterStates.Attacking))
                        this.hero.stateMachine.requestTransitionTo(CharacterStates.Unsheathing);
                }

                if (input.mouse.rightButton) {
                    //this.hero.health = 0;
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
                this.pitch = THREE.Math.clamp(this.pitch + movement.x * speed, THREE.Math.degToRad(75), THREE.Math.degToRad(150));

                if (!this.hero.isDead)
                    this.hero.mesh.quaternion.setFromAxisAngle(Const.UpVector, this.yaw);

                this.bias.y += 0//movement.x * 100;

                this.normalizePosition();
            }

            private previousKeepPlaying: boolean;

            public handleKeyboard(delta: number, input: InputManager, keybindings: IKeybindings): void {
                var hero = this.hero;

                // See if we are still alive
                if (this.hero.isDead) {
                    this.hero.stateMachine.requestTransitionTo(CharacterStates.Dying);
                }

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
                    // hero.mesh.translateX(1 * delta);
                }
                if (input.keyboard[keybindings.strafeRight]) {
                    // hero.mesh.translateX(-1 * delta);
                }
                if (input.keyboard[keybindings.moveBackward]) {

                }
                if (input.keyboard[keybindings.jump]) {
                    hero.stateMachine.requestTransitionTo(CharacterStates.Jumping);
                }


                if (this.hero.stateMachine.current == CharacterStates.Attacking) {
                    this.hero.stateMachine.requestTransitionTo(CharacterStates.Sheathing);
                }


                hero.stateMachine.requestTransitionTo(CharacterStates.Falling);
                hero.stateMachine.requestTransitionTo(CharacterStates.Idle);
                // Update the state machine before trying to reset it back to falling / idle
                hero.stateMachine.states[hero.stateMachine.current].update(delta, hero);
            }
        }
    }
} 