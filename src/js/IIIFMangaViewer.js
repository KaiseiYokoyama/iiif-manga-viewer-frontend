import init, {Viewer, Direction} from '../../pkg/iiif_manga_viewer_frontend.js';

/**
 * ビューアのIconViewのicon要素
 */
class IconViewItem extends HTMLElement {
    constructor() {
        super();

        this.addEventListener('click', () => {
            const src = this.getAttribute('src');
            // 表示
            this.mangaViewer.show(this.mangaViewer.viewer.get_index_by_src(src));
        });
    }

    /**
     * 要素が DOM に挿入されるたびに呼び出されます。
     * リソースの取得やレンダリングなどの、セットアップ コードの実行に役立ちます。
     * 一般に、この時点まで作業を遅らせるようにする必要があります。
     * [参考](https://developers.google.com/web/fundamentals/web-components/customelements?hl=ja)
     */
    connectedCallback() {
        // initialize
        this.classList.add('col', 'm4', 'l3');

        // label
        const label = document.createElement('label');
        this.appendChild(label);
        this.label = label;

        // 自分の所属するマンガビューアを登録しておく
        let mangaViewer = this;
        while (!(mangaViewer instanceof IIIFMangaViewer)) {
            mangaViewer = mangaViewer.parentElement;
            if (!mangaViewer) return;
        }
        this.mangaViewer = mangaViewer;
    }

    static get observedAttributes() {
        return ['label', 'src'];
    }

    /**
     * 要素が DOM に挿入されるたびに呼び出されます。
     * リソースの取得やレンダリングなどの、セットアップ コードの実行に役立ちます。
     * 一般に、この時点まで作業を遅らせるようにする必要があります。
     * [参考](https://developers.google.com/web/fundamentals/web-components/customelements?hl=ja)
     */
    attributeChangedCallback(attributeName, oldValue, newValue, namespace) {
        if (attributeName === 'label'&& this.label) {
            this.label.innerText = newValue;
        }
    }

    appendChild(newChild) {
        if (newChild instanceof HTMLLabelElement) {
            if (this.label) {
                this.label.remove();
            }
            this.label = newChild;
            super.appendChild(newChild);
        } else if (newChild instanceof HTMLImageElement) {
            if (this.image) {
                this.image.remove();
            }
            this.image = newChild;
            super.appendChild(newChild);
        }
    }
}

customElements.define('icon-view-item', IconViewItem);

/**
 * IconView
 */
class IconView extends HTMLElement {
    constructor() {
        super();
    }

    onOff() {
        this.classList.toggle('hide');
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
    }

    /**
     * 子要素を追加する。IconViewItem以外は無視。
     * @param newChild {ListViewItem} リストの子要素
     */
    appendChild(newChild) {
        console.log(newChild);
        if (newChild instanceof IconViewItem) {
            super.appendChild(newChild);
        }
    }
}

customElements.define('icon-view', IconView);

/**
 * ビューアのListViewのli要素
 */
class ListViewItem extends HTMLLIElement {
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

    loading() {
        this.setAttribute('loading', '');
    }

    loaded() {
        this.removeAttribute('loading');
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
        let listView = this;
        while (!(listView instanceof ListView)) {
            listView = listView.parentElement;
            if (!listView) return;
        }
        this.imageList = listView;

        // preloaderを表示
        // statusを表示するiconをセット cssで制御
        const i = document.createElement('i');
        i.classList.add('status-icon', 'right');
        this.appendChild(i);
    }
}

customElements.define("image-list-item", ListViewItem, {extends: "li"});

/**
 * ビューアのListView
 */
class ListView extends HTMLUListElement {
    constructor() {
        super();

        // 必要なclassを追加
        this.classList.add('collection', 'with-header', 'image-list');
    }

    onOff() {
        this.classList.toggle('hide');
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
     * @param newChild {ListViewItem} リストの子要素
     */
    appendChild(newChild) {
        if (newChild instanceof ListViewItem) {
            super.appendChild(newChild);

            // loading状態に設定
            newChild.loading();
        }
    }

    getChild(index) {
        return this.querySelectorAll('.image-list-item')[index];
    }
}

customElements.define("image-list", ListView, {extends: "ul"});

/**
 * ビューア本体
 */
class IIIFMangaViewer extends HTMLDivElement {
    constructor() {
        super();
    }

    /**
     * 要素が DOM に挿入されるたびに呼び出されます。
     * リソースの取得やレンダリングなどの、セットアップ コードの実行に役立ちます。
     * 一般に、この時点まで作業を遅らせるようにする必要があります。
     * [参考](https://developers.google.com/web/fundamentals/web-components/customelements?hl=ja)
     */
    connectedCallback() {
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
        this.listView = undefined;
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
        // this.initialize();
    }

    async initialize() {
        // initialize
        // 子要素をすべて削除
        await init();
        this.textContent = null;

        // canvasを設定
        const canvas = document.createElement('canvas');
        this.appendChild(canvas);

        // ListViewを設定
        const listView = document.createElement('ul', {is: "image-list"});
        this.listView = listView;
        this.appendChild(listView);

        // IconViewを設定
        const iconView = document.createElement('icon-view');
        this.iconView = iconView;
        this.appendChild(iconView);

        // viewerを設定
        this.viewer = new Viewer(canvas, listView,iconView);
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

                    // FAB(Floating Action Button)追加
                    const fabs = document.createElement('div');
                    fabs.classList.add('fixed-action-btn');
                    {
                        const mainFAB = document.createElement('a');
                        mainFAB.classList.add("btn-floating", "btn-large");
                        {
                            const i = document.createElement('i');
                            i.classList.add("large", "material-icons");
                            i.innerHTML = 'menu';
                            mainFAB.appendChild(i);
                        }
                        fabs.appendChild(mainFAB);

                        const subFABS = document.createElement('ul');
                        {
                            {
                                const li = document.createElement('li');
                                {
                                    const subFAB = document.createElement('a');
                                    subFAB.classList.add("btn-floating");
                                    {
                                        const i = document.createElement('i');
                                        i.classList.add("material-icons");
                                        i.innerHTML = 'list';
                                        subFAB.appendChild(i);
                                    }
                                    subFAB.onclick = () => this.listView.onOff();
                                    li.appendChild(subFAB);
                                }
                                subFABS.appendChild(li);
                            }
                        }
                        fabs.appendChild(subFABS);
                    }
                    this.appendChild(fabs);
                    M.FloatingActionButton.init(fabs, {hoverEnabled: false});

                    // 裏でloadを実行
                    let load = () => {
                        for (let i = 0; i < this.viewer.size(); i++) {
                            if (!this.viewer.is_loading(i)) {
                                this.viewer.load(i);
                            }
                            // loadが完了したらimageListの状態を変える
                            const image = this.viewer.get_image_elem(i);
                            const item = this.listView.getChild(i);
                            image.addEventListener('load', () => {
                                item.loaded();
                            });
                        }
                    };
                    new Thread(load()).execute();
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
                elem.addEventListener('load', () => {
                    this.removeChild(progress);
                    this.show(index);
                });
            }
        } else {
            this.listView.activate(index);
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
