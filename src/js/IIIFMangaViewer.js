import init, {Viewer} from '../../pkg/iiif_manga_viewer_frontend.js';

class IIIFMangaViewer extends HTMLDivElement {
    constructor() {
        super();
        this.initialize();
    }

    async initialize() {
        // initialize
        // 子要素をすべて削除
        await init();
        this.textContent = null;
        // canvasを設定
        let canvas = document.createElement('canvas');
        this.appendChild(canvas);
        this.viewer = new Viewer(canvas);
        {
            canvas.onmousedown = (event) => {
                this.viewer.mousedown(event);
            };
            canvas.onmousemove = (event) => {
                this.viewer.mousemove(event);
            };
            canvas.onmouseup = (event) => {
                this.viewer.mouseup(event);
            };
            canvas.onclick = (event) => {
                this.viewer.click(event);
            };
        }

        const manifestURL = this.getAttribute('manifest');
        if (manifestURL) {
            let images = await this.viewer.from_manifest(manifestURL);
            for (let image of images.srcs) {
                this.viewer.push_image(image);
            }
            this.show(0);

            // load
            let load = () => {
                for (let i = 0; i < this.viewer.size(); i++) {
                    if (!this.viewer.is_loading(i)) {
                        this.viewer.load(i);
                    }
                }
            };
            new Thread(load()).execute().terminate();
        }
    }

    show(index) {
        if (!this.viewer.show(index)) {
            let elem = this.viewer.get_image_elem(index);
            if (elem) {
                elem.onload = () => {
                    this.show(index);
                }
            }
        }
    }

    next() {
        if (!this.viewer.next()) {
            let elem = this.viewer.get_next_image_elem(index);
            if (elem) {
                elem.onload = () => {
                    this.show(index);
                }
            }
        }
    }

    prev() {
        if (!this.viewer.prev()) {
            let elem = this.viewer.get_prev_image_elem(index);
            if (elem) {
                elem.onload = () => {
                    this.show(index);
                }
            }
        }
    }


}

customElements.define("iiif-manga-viewer", IIIFMangaViewer, {extends: "div"});