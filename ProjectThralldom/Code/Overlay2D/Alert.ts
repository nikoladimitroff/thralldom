module Thralldom {
    class AlertWrapper {
        public type: string;
        public message: string;
        public duration: number;
        public timeoutId: number;
        constructor(type: string, message: string, duration: number) {
            this.type = type;
            this.message = message;
            this.duration = duration;
        }
    };

    export class Alert {
        private static MAX_ALERTS: number = 3;
        private static ui: HTMLElement;
        private static alerts: Array<AlertWrapper> = new Array<AlertWrapper>();
        private static DEFAULT_DURATION = 5000;

        constructor() {

        }

        public static setUi(alertsUi: HTMLElement) {
            this.ui = alertsUi;
        }

        public static info(message: string, duration: number = Alert.DEFAULT_DURATION) {
            this.alert("info", message, duration);
        }

        public static warning(message: string, duration: number = Alert.DEFAULT_DURATION) {
            this.alert("warning", message, duration);
        }

        public static error(message: string, duration: number = Alert.DEFAULT_DURATION) {
            this.alert("error", message, duration);
        }

        private static alert(type: string, message: string, duration: number) {
            this.alerts.unshift(new AlertWrapper(type, message, duration));
            if (this.alerts.length > Alert.MAX_ALERTS) {
                var last: AlertWrapper = this.alerts.pop();
                clearTimeout(last.timeoutId);
            }

            this.visualise();
        }

        private static visualise() {
            for (var i: number = 0; i < Alert.MAX_ALERTS; i++) {
                var child: HTMLElement = <HTMLElement> this.ui.children.item(i);

                if (this.alerts.length > i) {
                    var wrapper: AlertWrapper = this.alerts[i];
                    child.className = wrapper.type;
                    child.innerText = wrapper.message;
                    child.style.display = "block";
                }
                else {
                    child.className = "";
                    child.innerText = "";
                    child.style.display = "none";
                }
            }

            var child: HTMLElement = <HTMLElement> this.ui.children.item(0);
            UIManager.fadein(child);

            Alert.alerts[0].timeoutId = setTimeout(function () {
                
                console.log("MESSAGE HIDE", Alert.alerts.length - 1);
                var child: HTMLElement = <HTMLElement> Alert.ui.children.item(Alert.alerts.length-1);
                UIManager.fadeout(child);
                Alert.alerts.pop();
            }, wrapper.duration);
        }
    }
}
