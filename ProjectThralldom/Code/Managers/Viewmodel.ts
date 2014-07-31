module Thralldom {

    export class Viewmodel {
        username = "annonimous";
        greeting: string;
        settings: Array<any>;
        hud: any;

        constructor(azure: AzureManager,
            particleManager: ParticleManager,
            keybindings: CharacterControllers.IKeybindings,
            inventory: Inventory) {

            this.settings = [
                {
                    name: "Graphics",
                    id: "graphics",
                    options: [{
                        name: "Enable Particles?",
                        id: "enable-particles",
                        checked: ko.observable(false),
                        inputType: "checkbox",
                        onchange: (dataContext, event: Event) => {
                            var particles = <HTMLInputElement> event.srcElement;
                            if (particles.checked) {
                                particleManager.load();
                            }
                            else {
                                particleManager.destroy();
                            }
                            azure.save(this.getSettings());
                        }
                    }]
                },
                {
                    name: "Audio",
                    id: "audio",
                    options: [{
                        name: "Master Volume",
                        id: "master-volume",
                        value: ko.observable(100),
                        inputType: "range",
                        onchange: (observable, event: Event) => {
                            var volume = <HTMLInputElement> event.srcElement;
                            AudioManager.instance.masterVolume = ~~volume.value / ~~volume.max;
                            azure.save(this.getSettings());
                        }
                    }]
                }
            ];
            this.hud = {
                showHelp: false,
                inventory: inventory,
            };

            // KO Computed
            ko.defineProperty(this.hud, "interactKey", () => {
                return InputManager.keyCodeToKeyName(keybindings.interact);
            });

            // Call knockout ES5 tracking on observables
            this.track(keybindings);
        }

        private track(keybindings: CharacterControllers.IKeybindings): void {

            ko.track(this, ["username"]);
            ko.defineProperty(this, "greeting", () => "Hey there, {0}!".format(this.username))

            // Track only observable properties
            var settingsObservables = ["value", "checked"];
            for (var i = 0; i < this.settings.length; i++) {
                for (var j = 0; j < this.settings[i].options.length; j++) {
                    var option = this.settings[i].options[j];
                    var properties = settingsObservables.filter(o => option[o] != undefined);
                    ko.track(option, properties);
                }
            }
            // Inject ko in keybindings, one can even change a keybinding and ko will continue to work
            ko.track(keybindings);
            ko.track(this.hud, ["showHelp"]);
        }


        private getOptionValue(groupId: string, optionId: string): any {
            for (var i = 0; i < this.settings.length; i++) {
                var group = this.settings[i];
                if (group.id == groupId) {
                    for (var j = 0; j < group.options.length; j++) {
                        var option = group.options[j];
                        if (option.id == optionId) {
                            if (option.value !== undefined) return option.value;
                            if (option.checked !== undefined) return option.checked;
                            throw new Error("Invalid option");
                        }
                    }
                }
            }
        }

        private setOptionValue(groupId: string, optionId: string, value: any): any {
            for (var i = 0; i < this.settings.length; i++) {
                var group = this.settings[i];
                if (group.id == groupId) {
                    for (var j = 0; j < group.options.length; j++) {
                        var option = group.options[j];
                        if (option.id == optionId) {
                            value = JSON.parse(value);
                            if (option.value !== undefined) return option.value = value;
                            if (option.checked !== undefined) return option.checked = value;
                            throw new Error("Invalid option");
                        }
                    }
                }
            }
        }

        public getSettings(): any {
            var settings = {
                "particles_enabled": this.getOptionValue("graphics", "enable-particles"),
                "master_volume": this.getOptionValue("audio", "master-volume"),
            }

            return settings;
        }

        public setSettings(data: any): void {
            if (!data) 
                return;

            this.setOptionValue("graphics", "enable-particles", data["particles_enabled"]);
            this.setOptionValue("audio", "master-volume", data["master_volume"]);
            this.username = data.username;
        }

    }
}