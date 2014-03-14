module Thralldom {
    export module CharacterControllers {
        export class SkyrimCharacterController implements ICharacterController {

            public camera: THREE.PerspectiveCamera;
            public cameraSpeed: number;

            public hero: Character;
            public distance: number;
            public bias: THREE.Vector3;
            public yaw: number;
            public pitch: number;
            public skybox: Skybox;

            public static defaultSettings: IControllerSettings;

            private settings: IControllerSettings;

            constructor(aspectRatio: number, camSpeed: number, hero: Character, distance: number, bias: THREE.Vector3, skybox: Skybox) {
                this.camera = new THREE.PerspectiveCamera(60, aspectRatio, 1, 10000);
                this.hero = hero;
                this.distance = distance;
                this.bias = bias;
                this.cameraSpeed = camSpeed;
                this.yaw = 0;
                this.pitch = Math.PI / 2;


                this.skybox = skybox;

                this.camera.position.y = 20;

                this.settings = SkyrimCharacterController.defaultSettings;
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

                var movement = new THREE.Vector3;
                movement.y = (input.mouse.relative.x) * delta;
                movement.x = (input.mouse.relative.y) * delta;
                movement.z = (input.mouse.scroll - input.previousMouse.scroll) / 120;
                var speed = delta * this.settings.angularSpeed;

                // TODO: replace magic numbers! 
                this.distance -= movement.z * this.cameraSpeed;
                var turnSpeed = movement.y * speed; 
                this.yaw -= turnSpeed
                this.pitch = THREE.Math.clamp(this.pitch + movement.x * speed, THREE.Math.degToRad(75), THREE.Math.degToRad(150));

                //var transform = this.hero.rigidBody.getCenterOfMassTransform();

                //var quat = new Ammo.btQuaternion();
                //quat.setEuler(this.yaw * 10, 0, 0);

                //transform.setRotation(quat);

                //this.hero.rigidBody.setCenterOfMassTransform(transform);

                //this.hero.rigidBody.setAngularVelocity(new Ammo.btVector3(0, -movement.y * speed, 0));

                //this.hero.rigidBody.activate();
                //this.hero.rigidBody.applyTorqueImpulse(new Ammo.btVector3(0, -turnSpeed * 1000, 0));

                this.hero.mesh.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

                this.bias.y += 0//movement.x * 100;

                this.fixPosition();
            }

            private previousKeepPlaying: boolean;
            private getVelocityVector(delta: number, hero: Character, isSprinting: boolean = false): Ammo.btVector3 {
                var forward = new THREE.Vector3(0, 0, 1);
                var multiplier = this.settings.movementSpeed * delta;
                if (isSprinting)
                    multiplier *= this.settings.sprintMultiplier;

                forward.transformDirection(hero.mesh.matrix).multiplyScalar(multiplier);

                var velocity = hero.rigidBody.getLinearVelocity();
                velocity.setX(forward.x);
                velocity.setZ(forward.z);
                return velocity;
            }

            public handleKeyboardHeroMovement(delta: number, input: InputManager, keybindings: IKeybindings): void {
                var hero = this.hero;

                if (!(hero.stateMachine.current == CharacterStates.Jumping ||
                    hero.stateMachine.current == CharacterStates.Falling)) {
                    hero.rigidBody.setLinearVelocity(this.getVelocityVector(0, hero));
                }

                if (input.keyboard[keybindings.moveForward]) {      
                    // If the sprint key is down, try to sprint
                    if (input.keyboard[keybindings.sprint] && hero.stateMachine.requestTransitionTo(CharacterStates.Sprinting)) {
                        var velocity = this.getVelocityVector(delta, hero, true);
                        hero.rigidBody.setLinearVelocity(velocity);
                    }
                    // Otherwise just walk
                    else if (hero.stateMachine.requestTransitionTo(CharacterStates.Walking)) {
                        var velocity = this.getVelocityVector(delta, hero);
                        hero.rigidBody.setLinearVelocity(velocity);
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
                hero.stateMachine.requestTransitionTo(CharacterStates.Falling);
                hero.stateMachine.requestTransitionTo(CharacterStates.Idle);
            }
        }
    }
} 