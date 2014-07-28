interface String {
    startsWith(prefix: string): boolean;
    endsWith(suffix: string): boolean;
    trimEnd(): string;
    trimStart(): string;
    format(...args): string;
} 