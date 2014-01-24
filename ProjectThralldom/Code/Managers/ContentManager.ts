module Thralldom {
    export class ContentManager {

        private loadedContent: Map<string, any> = <Map<string, any>>{};

        private loaded: number = 0;
        private loading: number = 0;


        private onContentLoaded(path: string, object: any) {
            this.loaded++;
            this.loadedContent[path] = object;

            if (this.loading == this.loaded) {
                this.onLoaded();
            }

        }

        public onLoaded: () => void;

        public loadTexture(path: string, compressed?: boolean): void {
            
            this.loading++;

            if (compressed) {
                throw new Error("not supported");
            }
            else {
                THREE.ImageUtils.loadTexture(path, 0, (texture) => this.onContentLoaded(path, texture));
            }
        }

        public loadModel(path: string): void {
            this.loading++;

            var loader = new THREE.JSONLoader();
            var mesh: THREE.Object3D;
            loader.load(ContentLibrary.Models.Spartan.spartanJS, (geometry, materials) => {
                mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));
                geometry.computeFaceNormals();
                geometry.computeVertexNormals();
                this.onContentLoaded(path, mesh);
            });
        }

        public getContent(path: string): any {
            if (this.loadedContent[path]) {
                return this.loadedContent[path];
            }
            else {
                throw new Error("content not loaded");
            }
        }
    }
} 