module Thralldom {
    export class Item implements ILoadable {
        public name: string;
        public icon: string;
        public quantity: number;
        public quantityText: string;
        public code: number;

        public loadFromDescription(description: any, content: ContentManager): void {
            this.name = description.name;
            this.icon = description.icon;
            this.quantity = description.quantity || 0;
            if (description.code === undefined)
                throw new Error("Every item must have an item code");
            this.code = description.code;

            ko.defineProperty(this, "quantityText", () => "({0})".format(this.quantity));

            ko.track(this, ["quantity"]);
        }
    }

    export class Inventory implements ILoadable {
        public items: Array<Item>;

        constructor() {
            this.items = new Array<Item>();
        }

        public loadFromDescription(description: any, content: ContentManager): void {
            for (var i = 0; i < description.length; i++) {
                var item = new Item();
                item.loadFromDescription(description[i], content);
                this.items.push(item);
            }

            ko.track(this);
        }

        public addItemQuantity(itemCode: number, quantity: number): void {
            for (var i = 0; i < this.items.length; i++) {
                if (this.items[i].code == itemCode) {
                    this.items[i].quantity += quantity;
                    return;
                }
            }
        }

        public removeItem(itemCode: number): void {
            for (var i = 0; i < this.items.length; i++) {
                if (this.items[i].code == itemCode) {
                    this.items[i].quantity = 0;
                    return;
                }
            }
        }

        public getItemQuantity(itemCode: number): number {
            for (var i = 0; i < this.items.length; i++) {
                if (this.items[i].code == itemCode) {
                    return this.items[i].quantity;
                }
            }
        }
    }
} 