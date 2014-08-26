self["THREE"] = self["THREE"] || {};
self["THREE"].Vector3 = self["THREE"].Vector3 || function (x, y, z) { };
self["Ammo"] = self["Ammo"] || {};
self["Ammo"].btVector3 = self["Ammo"].btVector3 || function (x, y, z) { };

module Thralldom {
    export class Const {
        public static UpVector = Object.freeze(new THREE.Vector3(0, 1, 0));
        public static DownVector = Object.freeze(new THREE.Vector3(0, -1, 0));
        public static RightVector = Object.freeze(new THREE.Vector3(1, 0, 0));
        public static LeftVector = Object.freeze(new THREE.Vector3(-1, 0, 0));
        public static ForwardVector = Object.freeze(new THREE.Vector3(0, 0, 1));
        public static BackwardVector = Object.freeze(new THREE.Vector3(0, 0, -1));
        public static ZeroVector = Object.freeze(new THREE.Vector3(0, 0, 0));

        public static btUpVector = new Ammo.btVector3(0, 1, 0);
        public static btDownVector = new Ammo.btVector3(0, -1, 0);
        public static btRightVector = new Ammo.btVector3(1, 0, 0);
        public static btLeftVector = new Ammo.btVector3(-1, 0, 0);
        public static btForwardVector = new Ammo.btVector3(0, 0, 1);
        public static btBackwardVector = new Ammo.btVector3(0, 0, -1);
        public static btZeroVector = new Ammo.btVector3(0, 0, 0);


        public static dtoUpVector = Object.freeze(new VectorDTO(0, 1, 0));
        public static dtoDownVector = Object.freeze(new VectorDTO(0, -1, 0));
        public static dtoRightVector = Object.freeze(new VectorDTO(1, 0, 0));
        public static dtoLeftVector = Object.freeze(new VectorDTO(-1, 0, 0));
        public static dtoForwardVector = Object.freeze(new VectorDTO(0, 0, 1));
        public static dtoBackwardVector = Object.freeze(new VectorDTO(0, 0, -1));
        public static dtoZeroVector = Object.freeze(new VectorDTO(0, 0, 0));

        public static MaxAnisotropy: number = 1;
    }
} 