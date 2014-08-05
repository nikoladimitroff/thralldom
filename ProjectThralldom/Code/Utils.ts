module Thralldom {
    export class Utils {
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

        public static AttachCacheUpdatedHandler(): void {
            // Straight from http://www.html5rocks.com/en/tutorials/appcache/beginner/
            window.applicationCache.addEventListener('updateready', function (e) {
                if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
                    // Browser downloaded a new app cache.
                    if (confirm('A new version is available. Refresh?')) {
                        window.location.reload();
                    }
                } else {
                    // Manifest didn't changed. Nothing new to server.
                }
            }, false);
        }

        public static setWindowFocusListener(listener: (isVisible: boolean) => void): void {
            var hidden = "hidden";

            // Standards:
            if (hidden in document)
                document.addEventListener("visibilitychange", onchange);
            else if ((hidden = "mozHidden") in document)
                document.addEventListener("mozvisibilitychange", onchange);
            else if ((hidden = "webkitHidden") in document)
                document.addEventListener("webkitvisibilitychange", onchange);
            else if ((hidden = "msHidden") in document)
                document.addEventListener("msvisibilitychange", onchange);
            // IE 9 and lower:
            else if ('onfocusin' in document)
                document.onfocusin = document.onfocusout = onchange;
            // All others:
            else
                window.onpageshow = window.onpagehide
                = window.onfocus = window.onblur = onchange;

            function onchange(evt) {
                var v = 'visible', h = 'hidden',
                    evtMap = {
                        focus: v, focusin: v, pageshow: v, blur: h, focusout: h, pagehide: h
                    };

                evt = evt || window.event;
                var visibility;
                if (evt.type in evtMap)
                    visibility = evtMap[evt.type];
                else
                    visibility = this[hidden] ? "hidden" : "visible";

                listener(visibility == "visible");
            }
        }

        public static convertFrameToTime(frame: number, animation: THREE.Animation) {
            return frame / animation.root.geometry.animation.fps;
        }


        public static parseVector3(text: string): THREE.Vector3 {
            var coordinates = text.match(/-?\d+(?:\.\d+)?/g);

            return new THREE.Vector3(parseFloat(coordinates[0]), parseFloat(coordinates[1]), parseFloat(coordinates[2]));
        }

        public static parseVector2(text: string): THREE.Vector2 {
            var coordinates = text.match(/-?\d+(?:\.\d+)?/g);

            return new THREE.Vector2(parseFloat(coordinates[0]), parseFloat(coordinates[1]));
        }

        public static formatVector(vector: THREE.Vector3, precision: number): string;
        public static formatVector(vector: Ammo.btVector3, precision: number): string;
        public static formatVector(vector: any, precision: number): string {
            var x = vector.x instanceof Function ? vector.x() : vector.x;
            var y = vector.y instanceof Function ? vector.y() : vector.y;
            var z = vector.z instanceof Function ? vector.z() : vector.z;
            return "({0}, {1}, {2})".format(x.toFixed(precision), y.toFixed(precision), z.toFixed(precision));
        }
    }
}