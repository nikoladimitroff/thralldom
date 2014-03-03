declare enum StatsModes {
    Fps = 0,
    Ms = 1
}

declare class Stats {
    public domElement: HTMLElement;
    public setMode(mode: StatsModes): void;
    public begin(): void;
    public end(): void;
}