import init, {Viewer, Direction} from '../../pkg/iiif_manga_viewer_frontend.js';

/**
 * ビューアのImageListのli要素
 */
class ImageListItem extends HTMLLIElement {
    constructor() {
        super();

        // 必要なclassを追加
        this.classList.add('collection-item', 'image-list-item');

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

    /**
     * 要素が DOM に挿入されるたびに呼び出されます。
     * リソースの取得やレンダリングなどの、セットアップ コードの実行に役立ちます。
     * 一般に、この時点まで作業を遅らせるようにする必要があります。
     * [参考](https://developers.google.com/web/fundamentals/web-components/customelements?hl=ja)
     */
    connectedCallback() {
        // 自分の所属するマンガビューアを登録しておく
        let mangaViewer = this;
        while (!(mangaViewer instanceof IIIFMangaViewer)) {
            mangaViewer = mangaViewer.parentElement;
            if (!mangaViewer) return;
        }
        this.mangaViewer = mangaViewer;

        // 親要素を登録しておく
        let imageList = this;
        while (!(imageList instanceof ImageList)) {
            imageList = imageList.parentElement;
            if (!imageList) return;
        }
        this.imageList = imageList;
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
        this.classList.add('collection', 'with-header', 'image-list');
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
     * 特定の子要素のみをactivateする
     * @param index
     */
    activate(index) {
        this.deactivate();
        const item = this.children[index];
        item.classList.add('active');
    }

    /**
     * 子要素を追加する。ImageListItem以外は無視。
     * @param newChild {ImageListItem} リストの子要素
     */
    appendChild(newChild) {
        if (newChild instanceof ImageListItem) {
            super.appendChild(newChild);
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

    /**
     * 要素が DOM から削除されるたびに呼び出されます。
     * クリーンアップ コードの実行（イベント リスナーの削除など）に役立ちます。
     * [参考](https://developers.google.com/web/fundamentals/web-components/customelements?hl=ja)
     */
    disconnectedCallback() {
        // メモリ開放
        this.viewer.free();
        this.imageList = undefined;
    }

    static get observedAttributes() {
        return ['manifest'];
    }

    /**
     * 属性が追加、削除、更新、または置換されたとき。
     * パーサーによって要素が作成されたときの初期値に対して、またはアップグレードされたときにも呼び出されます。
     * 注: observedAttributes プロパティに示されている属性のみがこのコールバックを受け取ります。
     * [参考](https://developers.google.com/web/fundamentals/web-components/customelements?hl=ja)
     * @param name
     * @param oldValue
     * @param newValue
     */
    attributeChangedCallback(name, oldValue, newValue) {
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
        this.imageList = imageList;
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
        } else {
            this.imageList.activate(index);
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
