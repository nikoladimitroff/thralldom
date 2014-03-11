module Thralldom {
    export class btThralldomMotionState extends Ammo.btMotionState {
        public transform: Ammo.btTransform;
        public mesh: THREE.Mesh;


        getWorldTransform(transform: Ammo.btTransform): void {
            var pos = this.mesh.position;
            var quat = this.mesh.quaternion;
            transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
            transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
        }

        setWorldTransform(transform: Ammo.btTransform): void {
            var origin = transform.getOrigin();
            this.mesh.position.x = origin.x();
            this.mesh.position.y = origin.y();
            this.mesh.position.z = origin.z();

            var rotation = transform.getRotation();
            this.mesh.quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
        }
    }
}