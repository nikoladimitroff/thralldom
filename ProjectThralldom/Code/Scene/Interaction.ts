module Thralldom {
    export class Interaction implements ILoadable {

        public loadFromDescription(description: any, content: ContentManager): void {
            throw new Error("Interaction is abstract!");
        }

        public interact(hero: Character, quests: QuestManager, scripts: ScriptManager): void {
            throw new Error("Interaction is abstract!");
        }

        public static fromDescription(description: any): Interaction {
            var types: Array<() => void> = <any>[
                ItemInteraction,
                QuestInteraction,
                ScriptInteraction,
            ];
            var predicate = t => t.name.replace("Interaction", "").toLowerCase() == description.type;

            var type = types.first(predicate)
            var interaction: Interaction = new type();

            interaction.loadFromDescription(description, undefined);

            return interaction;
        }
    }

    export class ItemInteraction extends Interaction {
        private itemCode: number;
        private quantity: number;

        public loadFromDescription(description: any, content: ContentManager): void {
            if (description.itemCode === undefined || description.quantity === undefined)
                throw new Error("Missing itemcode and quantity!");

            this.itemCode = ~~description.itemCode;
            this.quantity = ~~description.quantity;
        }

         public interact(hero: Character, quests: QuestManager, scripts: ScriptManager): void {
            var item = this.itemCode;
            var quantity = this.quantity;
            hero.inventory.addItemQuantity(item, quantity);
            var info = "{0} {1} added!".format(quantity, hero.inventory.items.first(i => i.code == item).name);
            Alert.info(info);
        }
    }

    export class QuestInteraction extends Interaction {
        private questName: string;
        private done: boolean;

        public loadFromDescription(description: any, content: ContentManager): void {
            if (description.quest === undefined)
                throw new Error("Missing quest name!");

            this.questName = description.quest;
        }

        public interact(hero: Character, quests: QuestManager, scripts: ScriptManager): void {
            if (!this.done) {
                quests.activate(this.questName);
                var info = "The quest \"{0}\" started!".format(this.questName);
                Alert.info(info);
                this.done = true;
            }
        }
    }



    export class ScriptInteraction extends Interaction {
        private scriptName: string;
        private done: boolean;

        public loadFromDescription(description: any, content: ContentManager): void {
            if (description.script === undefined)
                throw new Error("Missing script name!");

            this.scriptName = description.script;
        }

        public interact(hero: Character, quests: QuestManager, scripts: ScriptManager): void {
            if (!this.done) {
                scripts.activate(this.scriptName);
                this.done = true;
            }
        }
    }
} 