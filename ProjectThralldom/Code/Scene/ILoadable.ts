module Thralldom {
    export interface ILoadable {
        loadFromDescription(description: any, content: ContentManager): void;
    }
} 