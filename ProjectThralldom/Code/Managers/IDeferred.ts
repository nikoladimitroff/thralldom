module Thralldom {
    export class IDeferred<T> {
        completed: (callback: (arguments: T) => void) => void;
    }
} 