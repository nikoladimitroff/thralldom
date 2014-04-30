declare module WindowsAzure {
    export class MobileServiceClient {
        constructor(address: string, key: string);
        currentUser: any;

        login(apiProvider: string): any;
        getTable(name: string): any;
    }
} 