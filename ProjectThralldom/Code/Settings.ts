module Thralldom {
    export interface IPhysicsSettings {
        angularDamping: number;
        linearDamping: number;
        gravity: number;
        friction: number;
        restitution: number;
    }

    export interface IControllerSettings {
        angularSpeed: number;
    }

    export interface ICharacterSettings {
        mass: number;
        jumpImpulse: number;
        viewAngle: number;

        movementSpeed: number;
        sprintMultiplier: number;
    }
} 