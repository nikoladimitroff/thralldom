module Thralldom {

    export enum CharacterStates {
        Idle,
        Walking,
        Sprinting,
        Jumping,
        Shooting,
        Dying
    }

    export class Character extends DynamicObject {
        public static MaxViewAngle = Math.PI / 3;
        public static CharacterJumpVelocity = 30;


        public get mesh(): THREE.Mesh {
            return this.skinnedMesh;
        }

        public animation: THREE.Animation;
        public keepPlaying: boolean;

        private skinnedMesh: THREE.SkinnedMesh;
        private hp: number;
        private range: number;
        private damage: number;

        public get health(): number {
            return this.hp;
        }

        public set health(value: number) {
            this.hp = value;
        }

        public states: StateMachine;

        constructor() {
            super();

            this.hp = 100;
            this.range = 100;
            this.damage = 1;

            this.initStateMachine();
        }

        private initStateMachine(): void {
            var transitions = new Array<Array<number>>();
            transitions[CharacterStates.Idle] = [CharacterStates.Dying, CharacterStates.Jumping, CharacterStates.Shooting, CharacterStates.Sprinting, CharacterStates.Walking];
            transitions[CharacterStates.Walking] = [CharacterStates.Dying, CharacterStates.Idle, CharacterStates.Jumping, CharacterStates.Shooting, CharacterStates.Sprinting];
            transitions[CharacterStates.Sprinting] = [CharacterStates.Dying, CharacterStates.Idle, CharacterStates.Jumping, CharacterStates.Walking];
            transitions[CharacterStates.Shooting] = [CharacterStates.Dying, CharacterStates.Idle];
            transitions[CharacterStates.Dying] = [];
            transitions[CharacterStates.Jumping] = [CharacterStates.Dying];

            var callbacks = new Array<(previous: number) => void>();
            var dummy = (previous: number) => { };
            for (var i = 0; i < transitions.length; i++) {
                callbacks[i] = dummy;
            }
            callbacks[CharacterStates.Jumping] = (previous: number) => {
                this.rigidBody.velocity.y = Character.CharacterJumpVelocity;               

            };

            var extras = new Array<(nextState: number) => boolean>();
            for (var i = 0; i < transitions.length; i++) {
                extras[i] = (state) => {
                    if (state == CharacterStates.Jumping) {
                        return GeometryUtils.almostZero(this.rigidBody.velocity.y);
                    }
                    return false;
                };
            }
            extras[CharacterStates.Jumping] = (state: number) => GeometryUtils.almostZero(this.rigidBody.velocity.y);

            this.states = new StateMachine(transitions, extras, callbacks);
        }

        public loadFromDescription(description: any, content: ContentManager): void {
            super.loadFromDescription(description, content);

            if (description.model) {
                this.skinnedMesh = content.getContent(description["model"]);
                this.animation = new THREE.Animation(this.skinnedMesh, this.skinnedMesh.geometry.animation.name, THREE.AnimationHandler.LINEAR);
                //this.animation.play();
            }

            if (description.pos) {
                this.mesh.position.set(description.pos[0], description.pos[1], description.pos[2]);
            }
            if (description.rot) {
                var rot = description.rot;
                this.mesh.rotation.set(rot[0], rot[1], rot[2]);
            }
            if (description.scale) {
                var scale = description.scale;
                this.mesh.scale.set(scale, scale, scale);
            }

            this.rigidBody = PhysicsManager.computeRigidBodyFromMesh(this.mesh, 70);
            
        }

        public attack(enemy: Character, hitPoint: THREE.Intersection): Ammo {
            // Only attack if the viewing angle between the character and the target is less than Character.MaxViewAngle and the character is in range.
            var distance = new THREE.Vector3();
            distance.subVectors(enemy.mesh.position, this.mesh.position);
            var forwardVector = new THREE.Vector3(0, 0, 1);
            forwardVector.transformDirection(this.mesh.matrix);

            if (distance.length() < this.range && distance.angleTo(forwardVector) < Character.MaxViewAngle) {
                enemy.health -= this.damage;

            }

            // For now, always shoot a laser.
            var startPoint = new THREE.Vector3();
            startPoint.copy(this.mesh.position).y = 10;
            var laser = new LaserOfDeath(startPoint, hitPoint.point);
            return laser;

            return undefined;
        }

        public update(delta: number): void {
            if (this.id != "hero") { 
                var radiusSquared = this.mesh.position.lengthSq();
                var dvar = 1e-6;
                var equation = (x: number, y: number) => x * x + y * y - radiusSquared;
                var derivative = (x: number, y: number) => new THREE.Vector2(equation(x, y) - equation(x + dvar, y), equation(x, y) - equation(x, y + dvar));
                var tangent = (x: number, y: number) => {
                    var df = derivative(x, y);
                    return new THREE.Vector2(-df.y, df.x);
                };

                var normal = derivative(this.rigidBody.position.x, this.rigidBody.position.z);
                var velocity =
                    tangent(this.rigidBody.position.x, this.rigidBody.position.z)
                    .multiplyScalar(1e7 * delta);

                var normalizedVelocity = new THREE.Vector3(velocity.x, 0, velocity.y);
                normalizedVelocity.normalize();

                var normVel = new CANNON.Vec3(normalizedVelocity.x, 0, normalizedVelocity.z);
                var quat = new CANNON.Quaternion();
                var asd = new THREE.Quaternion();
                quat.setFromVectors(new CANNON.Vec3(0, 0, 1), normVel);
                this.rigidBody.quaternion.set(quat.x, quat.y, quat.z, quat.w);

                this.rigidBody.velocity.x = velocity.x;
                this.rigidBody.velocity.z = velocity.y;
            }

        }
    }
} 