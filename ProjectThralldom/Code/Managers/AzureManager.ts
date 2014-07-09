module Thralldom {
    export class AzureManager {
        private client: WindowsAzure.MobileServiceClient;
        private userInfo: any;

        // MAKE THE LOGIN AT A DIFFERENT TIME & PLACE
        // PERHAPS A PRE-START MAIN MENU SCREEN
        // TEST IT LOADING A GAME

        public get loggedIn(): boolean {
            return this.client.currentUser != null;
        }

        constructor() {
            this.client = new WindowsAzure.MobileServiceClient(
                "https://thralldom.azure-mobile.net/",
                "YusQHkTsjDxkzPYdtylfQAjFIGsvRu73"
                );
            this.userInfo = this.client.getTable("userinfo");
            this.updateText("Hey there, annonymous!");
        }

        public login(): void {
            this.client.login("microsoftaccount").done(
                this.loadInformation.bind(this),
                (error) => console.log(error)
                );
        }

        private loadInformation(): void {
            var id = this.client.currentUser.userId;
            console.log(id);
            this.userInfo.read().done((result) => {
                result = result[0];
                if (!result || !result.id) {
                    this.userInfo.insert({ "particles_enabled": false, "master_volume": 100 })
                        .done(this.loadInformation.bind(this), (err) => console.log(err));
                    return;
                }

                // Graphics
                var particles: HTMLInputElement = <any>document.getElementById("enable-particles");
                particles.checked = JSON.parse(result.particles_enabled);
                // Sound
                var volume: HTMLInputElement = <any>document.getElementById("master-volume");
                volume.value = result.master_volume.toString();

                this.updateText("Hey there, " + result.username + "!");

            }, function (error) {
                console.log(error);
            });
        }

        public save(particles: boolean, masterVolume: number): void {
            if (this.loggedIn)
                this.userInfo.update({ id: this.client.currentUser.userId, particles_enabled: particles, master_volume: masterVolume });
        }

        private updateText(text: string): void {
            document.querySelector("#paused-screen nav.fadein").setAttribute("data-content", text);
        }
    }
}