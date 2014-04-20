module Thralldom { 
    export class Pool<T> {
        private typeConstructor: () => void;
        private pool: Array<T>;
        private lastTakenIndex: number;

        constructor(typeConstructor:  () => void) {
            this.typeConstructor = typeConstructor;
            this.pool = new Array<T>();
            this.lastTakenIndex = 0;
        }

        public getObject(): T {
            if (this.lastTakenIndex >= this.pool.length) {
                var obj = new this.typeConstructor();
                this.pool.push(obj);
            }

            return this.pool[this.lastTakenIndex++];
        }

        public release(obj: T): void {
            var index = -1;
            for (var i = 0; i < this.lastTakenIndex; i++) {
                if (this.pool[i] == obj) {
                    index = i;
                    break;
                }
            }
            if (index != -1) {
                this.lastTakenIndex--;
                var placeholder = this.pool[index];
                this.pool[index] = this.pool[this.lastTakenIndex];
                this.pool[this.lastTakenIndex] = placeholder;
            }
        }
    }
} 