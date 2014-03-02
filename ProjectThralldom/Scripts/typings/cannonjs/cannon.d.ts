declare module CANNON {
    // THREE.JS interface adapters

    export interface Vector {
        x: number;
        y: number;
        z: number;
    }

    // CANNON.JS

    export class EventTarget {
        addEventListener(type, listener: Function): void;
        removeEventListener(type, listener: Function): void;
        dispatchEvent(event: Event): void;
    }

    export interface CollisionArgs {
        with: RigidBody;
        contact: ContactEquation;
        type: string;
    }

    export class World {
        time: number;
        gravity: Vec3;
        quatNormalizeFast: boolean;
        quatNormalizeSkip: number;
        solver: Solver;
        broadphase: any;
        defaultContactMaterial: any;


        add(body: RigidBody): void;
        step(dt: number): void;
        addContactMaterial(material: ContactMaterial): void;

    }

    export class NaiveBroadphase {

    }

    export class Shape {

    }

    export class Plane extends Shape {

    }

    export class Box extends Shape {
        constructor(halfExtents: Vec3);
    }

    export class Body extends EventTarget {
        world: World;
        preStep: Function;
        postStep: Function;
    }

    export class RigidBody extends Body {
        constructor(mass: number, shape: Shape);
        constructor(mass: number, shape: Shape, material: Material);
        position: Vec3;
        quaternion: Quaternion;
        id: number;

        // CUSTOM
        centerToMesh: THREE.Vector3;
    }

    export class Solver {
        iterations: number;
        tolerance: number;
    }

    export class GSSolver extends Solver {

    }

    export class SplitSolver extends Solver {
        constructor(solver: Solver);

    }

    export class Material {
        constructor(name: string);
    }

    export class ContactMaterial {
        constructor(mat1: CANNON.Material, mat2: CANNON.Material, friction: number, restitution: number);
        contactEquationStiffness: number;
        contactEquationRegularizationTime: number;
        frictionEquationStiffness: number;
        frictionEquationRegularizationTime: number;
    }

    export class ContactEquation {

    }

    export class Vec3 implements Vector {
        constructor(x: number, y: number, z: number);
        x: number;
        y: number;
        z: number;

        set(x: number, y: number, z: number): Vec3;
        copy(vector: Vector): Vec3;
        vadd(vector: Vector, target: Vec3): Vec3;
        vsub(vector: Vector, target: Vec3): Vec3;
    }

    export class Quaternion {
        x: number;
        y: number;
        z: number;
        w: number;

        set(x: number, y: number, z: number, w: number): Quaternion;
        copy(quat: Quaternion): void;
        setFromAxisAngle(vec: Vec3, angle: number): void;
    }
}
