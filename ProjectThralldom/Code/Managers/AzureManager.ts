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
        }

        public login(callback: (any) => void): void {
            this.client.login("microsoftaccount").done(
                this.loadInformation.bind(this, callback),
                (error) => console.log(error)
                );
        }

        private loadInformation(updateCallback: (any) => void): void {
            var id = this.client.currentUser.userId;
            this.userInfo.read().done((result) => {
                if (result && result[0]) {
                    updateCallback(result[0]);
                }
                else {
                    this.userInfo.insert({
                        id: this.client.currentUser.id
                    });
                }
            }, function (error) {
                console.log(error);
            });
        }

        public save(info: any): void {
            if (this.loggedIn) {
                info = JSON.parse(JSON.stringify(info)); // Deep copy
                info.id = this.client.currentUser.userId;
                this.userInfo.update(info);
            }
        }
    }
}