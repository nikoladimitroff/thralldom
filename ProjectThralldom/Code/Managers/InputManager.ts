module Thralldom {
    export class InputManager {

        public mouse: MouseData;
        public previousMouse: MouseData;
        public keyboard: Array<boolean>;
        public previousKeyboard: Array<boolean>;

        // Listens for keypresses
        private keyPressListener: IDeferred<number>;
        private completeKeyPress: (number) => void;

        constructor() {
            this.keyboard = [];
            this.previousKeyboard = [];
            this.mouse = new MouseData();
            this.previousMouse = new MouseData();

            this.init();
        }

        private init(): void {
            window.onkeydown = (args) => {
                this.keyboard[args.keyCode] = true;

                // If we are awaiting key detection, raise the event
                if (this.keyPressListener) {
                    this.completeKeyPress(args.keyCode);
                }
            };
            window.onkeyup = (args) => {
                this.keyboard[args.keyCode] = false;
            };
            window.onmousedown = (args) => {
                switch (args.button) {
                    case 0:
                        this.mouse.leftButton = true;
                        break;
                    case 1:
                        this.mouse.middleButton = true;
                        break;
                    case 2:
                        this.mouse.rightButton = true;
                        break;
                };
            };
            window.onmouseup = (args) => {
                switch (args.button) {
                    case 0:
                        this.mouse.leftButton = false;
                        break;
                    case 1:
                        this.mouse.middleButton = false;
                        break;
                    case 2:
                        this.mouse.rightButton = false;
                        break;
                };
            };

            window.onmousemove = (args) => {
                this.mouse.coordinates.x = args.x;
                this.mouse.coordinates.y = args.y;
            };

            window.onmousewheel = (args) => {
                this.mouse.scroll += args.wheelDelta;
            };
        }

        public swap(): void {
            this.previousKeyboard = Array.apply(Array, this.keyboard);
            this.previousMouse.cloneFrom(this.mouse);

        }

        public detectKeyPress(): IDeferred<number> {
            var object: any = {};
            var isCompleted = false;
            // Create a new object and asign our complete key press delegate to call its completed method
            object.completed = (callback: (arguments: number) => void) => {
                this.completeKeyPress = (code: number) => {
                    callback(code);
                    this.keyPressListener = null;
                };
            };

            return this.keyPressListener = object;
        }

        // Statics 
        public static keyCodeToKeyName(keyCode: number): string {
            return InputManager.keyCodeToName[keyCode];
        }

        public static keyNameToKeyCode(keyName: string): number {
            return InputManager.keyNameToCode[keyName];
        }

        private static generateKeyCodeToNameMapping(): Array<string> {
            var nonLetters: Array<string> = [];

            nonLetters[8] = "Backspace";
            nonLetters[9] = "Tab";
            nonLetters[13] = "Enter";
            nonLetters[16] = "Shift";
            nonLetters[17] = "Control";
            nonLetters[18] = "Alt";
            nonLetters[19] = "Pause/Break";
            nonLetters[20] = "Caps lock";
            nonLetters[27] = "Escape";
            nonLetters[33] = "Page up";
            nonLetters[34] = "Page down";
            nonLetters[35] = "End";
            nonLetters[36] = "Home";
            nonLetters[37] = "Left Arrow";
            nonLetters[38] = "Up Arrow";
            nonLetters[39] = "Right Arrow";
            nonLetters[40] = "Down arrow";
            nonLetters[45] = "Insert";
            nonLetters[46] = "Delete";
            nonLetters[91] = "Left Window Key";
            nonLetters[92] = "Right Window Key";
            nonLetters[93] = "Select Key";
            nonLetters[96] = "Num 0";
            nonLetters[97] = "Num 1";
            nonLetters[98] = "Num 2";
            nonLetters[99] = "Num 3";
            nonLetters[100] = "Num 4";
            nonLetters[101] = "Num 5";
            nonLetters[102] = "Num 6";
            nonLetters[103] = "Num 7";
            nonLetters[104] = "Num 8";
            nonLetters[105] = "Num 9";
            nonLetters[106] = "Num *";
            nonLetters[107] = "Num +";
            nonLetters[109] = "Num -";
            nonLetters[110] = "Num .";
            nonLetters[111] = "Num /";
            nonLetters[112] = "F1";
            nonLetters[113] = "F2";
            nonLetters[114] = "F3";
            nonLetters[115] = "F4";
            nonLetters[116] = "F5";
            nonLetters[117] = "F6";
            nonLetters[118] = "F7";
            nonLetters[119] = "F8";
            nonLetters[120] = "F9";
            nonLetters[121] = "F10";
            nonLetters[122] = "F11";
            nonLetters[123] = "F12";
            nonLetters[144] = "Num Lock";
            nonLetters[145] = "Scroll Lock";
            nonLetters[186] = ":";
            nonLetters[187] = "=";
            nonLetters[188] = ",";
            nonLetters[189] = "-";
            nonLetters[190] = ".";
            nonLetters[191] = "|";
            nonLetters[192] = "~";
            nonLetters[219] = "(";
            nonLetters[220] = "/";
            nonLetters[221] = ")";
            nonLetters[222] = "'";

            // Characters
            for (var i = 0; i < 26; i++) {
                nonLetters[i + 0x41] = String.fromCharCode(i + 0x41);
            }

            // Numbers
            for (var i = 0; i < 10; i++) {
                nonLetters[i + 0x30] = String.fromCharCode(i + 0x30);
            }

            return nonLetters;
        }
        private static keyCodeToName = InputManager.generateKeyCodeToNameMapping();
        // A small hack to shorten coding. Use Array.reduce to create an object that maps each key name to its keycode
        private static keyNameToCode = JSON.parse(InputManager.generateKeyCodeToNameMapping().reduce((previous, current, index, array) => {
            return previous.substring(0, previous.length - 1) + "\"" + array[index] + "\":" + index + ",}";
        }, "{}").replace(",}", "}"));
    }
}