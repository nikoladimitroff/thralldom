declare module Subs {

    export var updateInterval: number;

    export function parse(fileContents: string): Array<SubtitleItem>;
    export function playSubtitles(subtitles: Subtitles): void;

    export class SubtitleItem {
        public start: number;
        public end: number;
        public text: string;
    }

    export class Subtitles {
        constructor(content: Array<SubtitleItem>, domElement: HTMLElement);
    }


} 