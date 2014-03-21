module Thralldom {
    export class Utilities {
        public static GetOnResizeHandler(domContainer: HTMLElement, renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera): () => void {
            return function () {
                var width = domContainer.offsetWidth,
                    height = domContainer.offsetHeight;
                // notify the renderer of the size change
                renderer.setSize(width, height)
                // update the camera
                camera.aspect = width / height;
                camera.updateProjectionMatrix()
            };
        }

        public static convertFrameToTime(frame: number, animation: THREE.Animation) {
            return frame / animation.data.fps;
        }

        public static parseVector3(text: string): THREE.Vector3 {
            var coordinates = text.match(/\d+/g);

            return new THREE.Vector3(parseFloat(coordinates[0]), parseFloat(coordinates[1]), parseFloat(coordinates[2]));
        }

        public static formatString(format: string, ...args) {
            /// <summary>Replaces the format items in a specified String with the text equivalents of the values of   corresponding object instances. The invariant culture will be used to format dates and numbers.</summary>
            /// <param name="format" type="String">A format string.</param>
            /// <param name="args" parameterArray="true" mayBeNull="true">The objects to format.</param>
            /// <returns type="String">A copy of format in which the format items have been replaced by the   string equivalent of the corresponding instances of object arguments.</returns>
            return Utilities._toFormattedString(false, arguments);
        }

        public static formatVector(vector: THREE.Vector3, precision: number);
        public static formatVector(vector: Ammo.btVector3, precision: number);
        public static formatVector(vector: any, precision: number) {
            var x = vector.x instanceof Function ? vector.x() : vector.x;
            var y = vector.y instanceof Function ? vector.y() : vector.y;
            var z = vector.z instanceof Function ? vector.z() : vector.z;
            return Utilities.formatString("({0}, {1}, {2})", x.toFixed(precision), y.toFixed(precision), z.toFixed(precision));
        }

        private static _toFormattedString = function String$_toFormattedString(useLocale, args) {
            var result = '';
            var format = args[0];

            for (var i = 0; ;) {
                // Find the next opening or closing brace
                var open = format.indexOf('{', i);
                var close = format.indexOf('}', i);
                if ((open < 0) && (close < 0)) {
                    // Not found: copy the end of the string and break
                    result += format.slice(i);
                    break;
                }
                if ((close > 0) && ((close < open) || (open < 0))) {

                    if (format.charAt(close + 1) !== '}') {
                        throw new Error('format stringFormatBraceMismatch');
                    }

                    result += format.slice(i, close + 1);
                    i = close + 2;
                    continue;
                }

                // Copy the string before the brace
                result += format.slice(i, open);
                i = open + 1;

                // Check for double braces (which display as one and are not arguments)
                if (format.charAt(i) === '{') {
                    result += '{';
                    i++;
                    continue;
                }

                if (close < 0) throw new Error('format stringFormatBraceMismatch');


                // Find the closing brace

                // Get the string between the braces, and split it around the ':' (if any)
                var brace = format.substring(i, close);
                var colonIndex = brace.indexOf(':');
                var argNumber = parseInt((colonIndex < 0) ? brace : brace.substring(0, colonIndex), 10) + 1;

                if (isNaN(argNumber)) throw new Error('format stringFormatInvalid');

                var argFormat = (colonIndex < 0) ? '' : brace.substring(colonIndex + 1);

                var arg = args[argNumber];
                if (typeof (arg) === "undefined" || arg === null) {
                    arg = '';
                }

                // If it has a toFormattedString method, call it.  Otherwise, call toString()
                if (arg.toFormattedString) {
                    result += arg.toFormattedString(argFormat);
                }
                else if (useLocale && arg.localeFormat) {
                    result += arg.localeFormat(argFormat);
                }
                else if (arg.format) {
                    result += arg.format(argFormat);
                }
                else
                    result += arg.toString();

                i = close + 1;
            }

            return result;
        }
    }
}