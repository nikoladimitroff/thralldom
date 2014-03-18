module Thralldom {
    export class Const {
        public static UpVector = new THREE.Vector3(0, 1, 0);
        public static DownVector = new THREE.Vector3(0, -1, 0);
        public static RightVector = new THREE.Vector3(1, 0, 0);
        public static LeftVector = new THREE.Vector3(-1, 0, 0);
        public static ForwardVector = new THREE.Vector3(0, 0, 1);
        public static BackwardVector = new THREE.Vector3(0, 0, -1);
        public static ZeroVector = new THREE.Vector3(0, 0, 0);



        public static btUpVector = new Ammo.btVector3(0, 1, 0);
        public static btDownVector = new Ammo.btVector3(0, -1, 0);
        public static btRightVector = new Ammo.btVector3(1, 0, 0);
        public static btLeftVector = new Ammo.btVector3(-1, 0, 0);
        public static btForwardVector = new Ammo.btVector3(0, 0, 1);
        public static btBackwardVector = new Ammo.btVector3(0, 0, -1);
        public static btZeroVector = new Ammo.btVector3(0, 0, 0);
    }
} 