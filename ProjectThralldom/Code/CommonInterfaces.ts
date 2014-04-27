module Thralldom {
    export interface IIndexable<V> {
        [key: string]: V;
    }
    export interface INumberIndexable<V> {
        [key: number]: V;
    }
}