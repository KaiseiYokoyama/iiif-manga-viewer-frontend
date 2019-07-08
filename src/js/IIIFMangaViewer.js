import init, {Viewer, Direction} from '../../pkg/iiif_manga_viewer_frontend.js';

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
        const canvas = document.createElement('canvas');
        this.appendChild(canvas);
        // ImageListを設定
        const imageList = document.createElement('div');
        this.appendChild(imageList);
        this.viewer = new Viewer(canvas, imageList);
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
                let direction = this.viewer.click(event);
                switch (direction) {
                    case Direction.Left:
                        this.next();
                        break;
                    case Direction.Right:
                        this.prev();
                        break;
                }
            };
        }

        const manifestURL = this.getAttribute('manifest');
        if (manifestURL) {
            {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', manifestURL);
                xhr.onload = () => {
                    let manifest = xhr.responseText;
                    if (!this.viewer.set_manifest(manifest)){
                        // manifestの読み取りに失敗すると消える
                        this.remove();
                    }
                    this.show(0);
                    new Thread(() => {
                        for (let i = 0; i < this.viewer.size(); i++) {
                            if (!this.viewer.is_loading(i)) {
                                this.viewer.load(i);
                            }
                        }
                    }).execute().terminate();
                };
                xhr.send();
            }
        }
    }

    progress() {
        let div = document.createElement('div');
        div.innerHTML =
            "<div class=\"progress\" style='position: fixed;top: 50%;left: 50%; width: 50%;transform: translate(-50%, -50%);'>\n" +
            "    <div class='indeterminate'></div>" +
            "</div>";
        div = div.firstElementChild;
        this.appendChild(div);
        return div;
    }

    show(index) {
        if (!this.viewer.show(index)) {
            let progress = this.progress();
            let elem = this.viewer.get_image_elem(index);
            if (elem) {
                elem.onload = () => {
                    this.removeChild(progress);
                    this.show(index);
                }
            }
        }
    };

    next() {
        this.show(this.viewer.index + 1);
    };

    prev() {
        this.show(this.viewer.index - 1);
    };


}

customElements.define("iiif-manga-viewer", IIIFMangaViewer, {extends: "div"});