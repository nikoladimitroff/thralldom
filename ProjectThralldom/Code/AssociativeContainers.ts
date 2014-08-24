module Thralldom {
    export interface IHashable {
        hash(): number;
    }

    export class Set<T extends IHashable> {
        private container: INumberIndexable<T>;
        private size: number;

        constructor(...args: T[]) {
            this.container = {};
            for (var i = 0; i < args.length; i++) {
                this.add(args[i]);
            }
            this.size = args.length;
        }


        public get length(): number {
            return this.size;
        }

        public add(element: T): void {
            this.container[element.hash()] = element;
            this.size++;
        }

        public remove(element: T): void {
            delete this.container[element.hash()];// = undefined;
            this.size--;
        }

        public contains(element: T): boolean {
            return this.container[element.hash()] !== undefined;
        }

        public min(isLessThan: (rhs: T, lhs: T) => boolean): T {
            var minElement: T = this.container[Object.keys(this.container)[0]];

            for (var key in this.container) {
                if (isLessThan(this.container[key], minElement))
                    minElement = this.container[key];
            }

            return minElement;
        }
    }

    export class Map<K extends IHashable, V> {
        private container: INumberIndexable<V>;

        constructor() {
            this.container = {};
        }

        public setValue(key: K, value: V): void {
            this.container[key.hash()] = value;
        }

        public remove(key: K): void {
            delete this.container;
        }

        public getValue(key: K): V {
            return this.container[key.hash()];
        }
    }

    export class Pair<T1, T2> {
        public first: T1;
        public second: T2;

        constructor(first: T1, second: T2) {
            this.first = first;
            this.second = second;
        }
    }
} 