 module Thralldom {
     export class QuestManager {
         public quests: Array<Quest>;
         private active: Array<boolean>;
         private world: World;

         constructor(quests: Array<Quest>, world: World) {
             this.quests = quests;
             this.active = [true];
             this.world = world;
         }

         public get questText(): string {
             return this.quests.map((quest, index) => {
                 if (this.active[index]) 
                     return quest.toString()
                 return "";
            }).join("\n");
         }

         public update(frameInfo: FrameInfo) {
             for (var i = 0; i < this.quests.length; i++)
                 if (this.active[i])
                    this.quests[i].update(frameInfo, this.world);
         }

         public activate(questName: string): void {
             var questIndex = this.quests.indexOfFirst(q => q.name == questName);
             if (questIndex == -1)
                 throw new Error("No quest with the name {0} exists!".format(questName));
            this.active[questIndex] = true;
         }
     }  
 }