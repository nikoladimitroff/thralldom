module Thralldom {
    export interface IVector3 {
        x: number;
        y: number;
        z: number;
    }

    export interface IQuaternion {
        x: number;
        y: number;
        z: number;
        w: number;
    }

    export interface IRaycastResult {
        hasHit: boolean;
        hitPoint: IVector3;
        collisionObjectId: number;
    }

    export interface IRaycastParams {
        id: number;
        rayLength: number;
    }

    export interface IMeshFace {
        a: number;
        b: number;
        c: number;
    }

    export interface IWorkerMeshInfo {
        shapeUID: string;
        pos: IVector3;
        rot: IQuaternion;
        scale: number;
        mass: number;
        halfExtents: IVector3;
        centerToMesh: IVector3;
        raycastRayLength: number;
        vertices: Array<IVector3>;
        faces: Array<IMeshFace>;
    }


    export enum MessageCode {
        UpdateWorld,
        Raycast,
        CreateBody,
        SetWalkingVelocity,
        ApplyImpulse,
        AirborneObject,
        UpdateSettings,
    }

    export enum BodyType {
        Box,
        Capsule,
        TriangleMesh,
        Plane,
    }

    export var BODY_COUNT = 20;
    export var MEM_PER_NUMBER = 4;
    export var MEM_PER_VEC = 3 * MEM_PER_NUMBER;
    export var MEM_PER_QUAT = 4 * MEM_PER_NUMBER;
    export var MEM_PER_BODY = MEM_PER_NUMBER + MEM_PER_VEC;
    export var NUMBERS_PER_BODY = MEM_PER_BODY / MEM_PER_NUMBER;

    export class VectorDTO {
        public x: number;
        public y: number;
        public z: number;

        constructor(x: number, y: number, z: number) {
            this.x = x;
            this.y = y;
            this.z = z;
        }
    }

    export class QuatDTO {
        public x: number;
        public y: number;
        public z: number;
        public w: number;

        constructor(x: number, y: number, z: number, w: number) {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
        }
    }

    export class FaceDTO {
        public a: number;
        public b: number;
        public c: number;

        constructor(a: number, b: number, c: number) {
            this.a = a;
            this.b = b;
            this.c = c;
        }
    }
} 