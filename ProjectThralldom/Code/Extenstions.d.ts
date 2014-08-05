interface String {
    startsWith(prefix: string): boolean;
    endsWith(suffix: string): boolean;
    trimEnd(): string;
    trimStart(): string;
    format(...args): string;
} 

interface Array<T> {
    indexOfFirst(predicate: (element: T) => boolean): number;
    first(predicate: (element: T) => boolean): T;
    removeUnstable(element: T): void;
    removeUnstableAt(index: number): void;
}