import init, {Viewer, Direction} from '../../pkg/iiif_manga_viewer_frontend.js';

/**
 * ビューアのImageListのli要素
 */
class ImageListItem extends HTMLLIElement {
    constructor() {
        super();

        // 必要なclassを追加
        this.classList.add('collection-item');

        // onclickを設定: 表示
        this.onclick = () => {
            const src = this.getAttribute('src');
            // 表示
            this.mangaViewer.show(this.mangaViewer.viewer.get_index_by_src(src));
            // deactivate
            this.imageList.deactivate();
            // activate
            this.classList.toggle('active');
        }
    }

    initialize() {
        // 自分の所属するマンガビューアを登録しておく
        let mangaViewer = this;
        while (mangaViewer.getAttribute('is') !== 'iiif-manga-viewer') {
            mangaViewer = mangaViewer.parentElement;
            if (!mangaViewer) return;
        }
        this.mangaViewer = mangaViewer;

        // 親要素を登録しておく
        let imageList = this;
        while (imageList.getAttribute('is') !== 'image-list') {
            imageList = imageList.parentElement;
            if (!imageList) return;
        }
        this.imageList = imageList;
        console.log('imageList: ' + imageList);

    }
}

customElements.define("image-list-item", ImageListItem, {extends: "li"});

/**
 * ビューアのImageList
 */
class ImageList extends HTMLUListElement {
    constructor() {
        super();

        // 必要なclassを追加
        this.classList.add('collection', 'with-header');
    }

    /**
     * 子要素をdeactivateする
     */
    deactivate() {
        const children = this.children;
        for (const child of children) {
            child.classList.remove('active');
        }
    }

    /**
     * 子要素を追加する。ImageListItem以外は無視。
     * @param newChild {ImageListItem} リストの子要素
     */
    appendChild(newChild) {
        if (newChild.getAttribute('is') === 'image-list-item') {
            super.appendChild(newChild);
            newChild.initialize();
        }
    }
}

customElements.define("image-list", ImageList, {extends: "ul"});

/**
 * ビューア本体
 */
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
        const imageList = document.createElement('ul', {is: "image-list"});
        console.log('imageList.is=' + imageList.getAttribute('is'));
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
                    if (!this.viewer.set_manifest(manifest)) {
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
