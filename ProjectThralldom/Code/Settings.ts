module Thralldom {
    export interface IPhysicsSettings {
        angularDamping: number;
        linearDamping: number;
        gravity: number;
        friction: number;
        restitution: number;
    }

    export interface IControllerSettings {
        movementSpeed: number;
        angularSpeed: number;
        sprintMultiplier: number;
    }

    export interface ICharacterSettings {
        mass: number;
        jumpImpulse: number;
        viewAngle: number;
    }
} 