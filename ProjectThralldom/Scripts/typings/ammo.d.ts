declare module Ammo {

    export function destroy(object: any): void;

    export class btDefaultCollisionConfiguration {

    }

    export class btCollisionDispatcher {
        constructor(config: btDefaultCollisionConfiguration);
    }

    export class btDbvtBroadphase {

    }

    export class btSequentialImpulseConstraintSolver {

    }

    export class ClosestRayResultCallback {
        constructor(fromWorld: btVector3, toWorld: btVector3);

        hasHit(): boolean;
        get_m_collisionObject(): btCollisionObject;
        get_m_hitPointWorld(): btVector3;

        set_m_rayFromWorld(vec: btVector3): void;
        set_m_rayToWorld(vec: btVector3): void;
    }

    export class btCollisionWorld {
        rayTest(fromWorld: btVector3, toWorld: btVector3, callback: ClosestRayResultCallback): void;
    }

    export class btDiscreteDynamicsWorld extends btCollisionWorld {
        constructor(dispatcher: btCollisionDispatcher, overlappingPairCache: btDbvtBroadphase, solver: btSequentialImpulseConstraintSolver, collisionConfiguration: btDefaultCollisionConfiguration);
        setGravity(vec: btVector3): void;
        stepSimulation(timeStep: number, maxSubStep: number): void;

        addRigidBody(body: btRigidBody): void;
        addRigidBody(body: btRigidBody, bodyType: number, collisionMask: number): void;
    }

    export class btVector3 {
        constructor(x?: number, y?: number, z?: number);
        x();
        y();
        z();

        setX(x: number): void;
        setY(y: number): void;
        setZ(z: number): void;
        setValue(x: number, y: number, z: number): void;
        distance(vec: btVector3): number;
    }

    export class btQuaternion {
        constructor(x?: number, y?: number, z?: number, w?: number);
        x(): number;
        y(): number;
        z(): number;
        w(): number;

        setValue(x: number, y: number, z: number, w: number): void;
        setEuler(yaw: number, pitch: number, roll: number);
        setRotation(axis: btVector3, angle: number);
    }

    export class btCollisionShape {

    }

    export class btConvexShape extends btCollisionShape {

    }

    export class btConcaveShape extends btCollisionShape {

    }

    export class btBoxShape extends btConvexShape {
        constructor(halfExtents: btVector3);
    }

    export class btStaticPlaneShape extends btConvexShape {
        constructor(normal: btVector3, planeConstant: number);
    }

    export class btCapsuleShape extends btConvexShape {
        constructor(radius: number, height: number);
    }

    export class btStridingMeshInterface {
        getScaling(): btVector3;
        setScaling(scale: btVector3): void;
    }

    export class btTriangleMesh extends btStridingMeshInterface {
        addTriangle(a: btVector3, b: btVector3, c: btVector3);
        addTriangle(a: btVector3, b: btVector3, c: btVector3, removeDuplicates: boolean);
    }

    export class btTriangleMeshShape extends btConcaveShape {

    }

    export class btBvhTriangleMeshShape extends btTriangleMeshShape{
        constructor(stridingMeshInterface: btStridingMeshInterface, useQuantizedAabbCompression: boolean);
    }

    export class btTransform {
        setIdentity(): void;
        setOrigin(vec: btVector3): void;
        setRotation(quat: btQuaternion): void;

        getOrigin(): btVector3;
        getRotation(): btQuaternion;
    }

    export class btMotionState {
        constructor(transform: btTransform);
        getWorldTransform(transform: btTransform): void;
        setWorldTransform(transform: btTransform): void;
    }


    export class btDefaultMotionState extends btMotionState {
    }

    export class btRigidBodyConstructionInfo {
        constructor(mass: number, motionState: btMotionState, shape: btCollisionShape, inertia: btVector3);
        set_m_friction(frictionCoeff: number): void;
    }

    export class btCollisionObject {

    }

    export class btRigidBody extends btCollisionObject {
        constructor(info: btRigidBodyConstructionInfo);
        getMotionState(): btDefaultMotionState;
        setMotionState(): btDefaultMotionState;
        setCenterOfMassTransform(tranform: btTransform);
        getCenterOfMassTransform(): btTransform;
        setLinearVelocity(vec: btVector3): void;
        getLinearVelocity(): btVector3;
        setAngularVelocity(vec: btVector3): void;
        getAngularVelocity(): btVector3;
        setDamping(linearDamping: number, angularDamping: number): void;
        getLinearDamping(): number;

        setFlags(flags: number): void;
        getFlags(): number;

        setRestitution(restitutionCoeff: number): void;
        setFriction(frictionCoeff: number): void;
        setRollingFriction(frictionCoeff: number): void;

        applyTorque(vec: btVector3): void;
        applyCentralImpulse(vec: btVector3): void;
        applyTorqueImpulse(vec: btVector3): void;
        applyDamping(delta: number): void;
        setAngularFactor(vec: btVector3): void;
        isActive(): boolean;
        activate(): void;
        setActivationState(state: number): void;
        getActivationState(): number;

        // THRALLDOM STUFF
        centerToMesh: THREE.Vector3;
    }

    export class btPairCachingGhostObject extends btCollisionShape  {

    }

    export class btKinematicCharacterController {
        constructor(ghostObject: btPairCachingGhostObject, convexShape: btConvexShape, stepHeight: number);

        setFallSpeed(fallSpeed: number): void;
        setJumpSpeed(jumpSpeed: number): void;
        setMaxJumpHeight(maxJumpHeight: number): void;
        canJump(): boolean;
        jump(): void;
        setUpAxis(axis: number): void;

        setWalkDirection(walkDirection: btVector3): void;

        setVelocityForTimeInterval(velocity: btVector3, timeInterval: number): void;
        setMaxSlope(slopeRadians: number): void;

        getMaxSlope(): number;

        getGhostObject(): btPairCachingGhostObject;

        onGround(): boolean;
    }
    // Helper class for all constants
    export enum ActivationConstants {
        DISABLE_DEACTIVATION = 4,
    }

    export enum CollisionFlags {
        CF_STATIC_OBJECT = 1,
        CF_KINEMATIC_OBJECT = 2,
        CF_NO_CONTACT_RESPONSE = 4,
        CF_CUSTOM_MATERIAL_CALLBACK = 8,
        CF_CHARACTER_OBJECT = 16,
        CF_DISABLE_VISUALIZE_OBJECT = 32,
        CF_DISABLE_SPU_COLLISION_PROCESSING = 64 
    }
}