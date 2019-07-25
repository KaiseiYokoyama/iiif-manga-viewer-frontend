"use strict";

import init, {
    Viewer,
    Direction,
    SearchQuery,
    SearchResult,
    SearchResults,
    CurationItem,
    WasmCurationViewer,
} from '../../pkg/iiif_manga_viewer_frontend.js';

async function run() {
    await init();

    let open = (url) => {
        const viewers = document.getElementById('viewers');
        let viewer = new IIIFMangaViewer(url);
        viewers.appendChild(viewer);
    };

    let viewerCounter = 0;

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
                // メニュー非表示
                this.iconView.onOff();
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
            // this.classList.add();

            // label
            const label = document.createElement('label');
            label.innerText = this.getAttribute('label');
            this.appendChild(label);
            this.label = label;

            // 自分の所属するマンガビューアを登録しておく
            let mangaViewer = this;
            while (!(mangaViewer instanceof IIIFMangaViewer)) {
                mangaViewer = mangaViewer.parentElement;
                if (!mangaViewer) return;
            }
            this.mangaViewer = mangaViewer;

            // 親要素を登録しておく
            let iconView = this;
            while (!(iconView instanceof IconView)) {
                iconView = iconView.parentElement;
                if (!iconView) return;
            }
            this.iconView = iconView;
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
            if (attributeName === 'label' && this.label) {
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

            const a = this.mangaViewer.iconViewIcon;
            if (!this.classList.contains('hide')) {
                a.classList.add('available');
            } else {
                a.classList.remove('available');
            }
        }

        /**
         * 要素が DOM に挿入されるたびに呼び出されます。
         * リソースの取得やレンダリングなどの、セットアップ コードの実行に役立ちます。
         * 一般に、この時点まで作業を遅らせるようにする必要があります。
         * [参考](https://developers.google.com/web/fundamentals/web-components/customelements?hl=ja)
         */
        connectedCallback() {
            this.classList.add('hide');
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

            const a = this.mangaViewer.listViewIcon;
            if (!this.classList.contains('hide')) {
                a.classList.add('available');
            } else {
                a.classList.remove('available');
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
     * ビューアのCanvas
     */
    class ViewerCanvas extends HTMLElement {
        constructor(imageViewer) {
            super();
            this.imageViewer = imageViewer;
        }

        /**
         * 要素が DOM に挿入されるたびに呼び出されます。
         * リソースの取得やレンダリングなどの、セットアップ コードの実行に役立ちます。
         * 一般に、この時点まで作業を遅らせるようにする必要があります。
         * [参考](https://developers.google.com/web/fundamentals/web-components/customelements?hl=ja)
         */
        connectedCallback() {
            this.area = document.createElement('div');
            this.area.classList.add('area', 'hide');
            super.appendChild(this.area);

            // 自分の所属するビューアを登録しておく
            // let mangaViewer = this;
            // while (!(mangaViewer instanceof IIIFMangaViewer || mangaViewer instanceof CurationViewer)) {
            //     mangaViewer = mangaViewer.parentElement;
            //     if (!mangaViewer) return;
            // }
            // this.curationViewer = mangaViewer;

            // ドラッグ
            {
                this.addEventListener('mousedown', (event) => {
                    if (this.imageViewer.oncrop) {
                        this.cropStart(event);
                    } else {
                        this.imageViewer.viewer.move_mousedown(event);
                    }
                });
                this.addEventListener('mousemove', (event) => {
                    if (this.imageViewer.oncrop) {
                        this.cropping(event);
                    } else {
                        let position = this.imageViewer.viewer.move_mousemove(event);
                        if (position) {
                            this.imageViewer.move(position.x, position.y);
                            position.free();
                        }
                    }
                });
                this.addEventListener('mouseup', (event) => {
                    if (this.imageViewer.oncrop) {
                        this.crop(event);
                        this.imageViewer.cropping();
                    } else {
                        this.imageViewer.viewer.move_mouseup();
                    }
                });
            }
        }

        getImage() {
            return this.image;
        }

        cropStart = (event) => {
            if (event.target !== this.image) return;
            this.area.classList.remove('hide');

            this.cropOrigin = event;
            this.area.style.top = event.offsetY + this.image.offsetTop + 'px';
            this.area.style.bottom = event.offsetY + this.image.offsetTop + 'px';
            this.area.style.left = event.offsetX + this.image.offsetLeft + 'px';
            this.area.style.right = event.offsetX + this.image.offsetLeft + 'px';
        };

        cropping = (event) => {
            if (event.target !== this.image || !this.cropOrigin) return;

            let origin = this.cropOrigin;
            let top, bottom, left, right;
            if (origin.offsetX < event.offsetX) {
                left = origin.offsetX;
                right = event.offsetX;
            } else {
                right = origin.offsetX;
                left = event.offsetX;
            }
            if (origin.offsetY < event.offsetY) {
                top = origin.offsetY;
                bottom = event.offsetY;
            } else {
                bottom = origin.offsetY;
                top = event.offsetY;
            }
            this.area.style.top = top + this.image.offsetTop + 'px';
            this.area.style.height = (bottom - top) + 'px';
            this.area.style.left = left + this.image.offsetLeft + 'px';
            this.area.style.width = (right - left) + 'px';
        };

        crop = (event) => {
            let origin = this.cropOrigin;
            if (event.target !== this.image || !origin) {
                console.log('out of target');
                console.log(event.target);
                console.log(origin);
            } else {
                let manifestID = this.imageViewer.getAttribute('manifest');
                if (!manifestID) {
                    manifestID = this.imageViewer.viewer.now().manifest_id();
                }
                let imageID = this.image.src;
                let item = new CurationItem(manifestID, imageID, this.imageViewer.viewer.label() + '_' + this.imageViewer.viewer.image_label(), origin, event, this.image);
                // crop image
                {
                    let canvas = document.createElement('canvas');
                    let [sx, sy, sw, sh, dx, dy, dw, dh] =
                        [
                            item.get_x_start(),
                            item.get_y_start(),
                            item.get_x_end() - item.get_x_start(),
                            item.get_y_end() - item.get_y_start(),
                            0,
                            0,
                            item.get_x_end() - item.get_x_start(),
                            item.get_y_end() - item.get_y_start()
                        ];
                    canvas.width = dw;
                    canvas.height = dh;
                    canvas.getContext('2d').drawImage(this.image, sx, sy, sw, sh, dx, dy, dw, dh);

                    let img = new Image();
                    img.src = canvas.toDataURL('image/png');

                    item.set_image(img);
                    CurationViewer.curationViewer.push(item);
                }
            }

            this.area.classList.add('hide');
            // finish
            // this.cropOrigin = undefined;
        };

        appendChild(newChild) {
            if (newChild instanceof HTMLImageElement) {
                if (this.image) this.image.remove();

                newChild.addEventListener('mousedown', (event) => {
                    event.preventDefault();
                });
                newChild.addEventListener('mousemove', (event) => {
                    event.preventDefault();
                });
                newChild.addEventListener('mouseup', (event) => {
                    event.preventDefault();
                });
                this.image = newChild;
                super.appendChild(newChild);
            }
        }
    }

    customElements.define('viewer-canvas', ViewerCanvas);

    /**
     * Viewをまとめて配置するelement
     */
    class Views extends HTMLElement {
        constructor() {
            super();
            // this.classList.add('views');
        }

        /**
         * 要素が DOM に挿入されるたびに呼び出されます。
         * リソースの取得やレンダリングなどの、セットアップ コードの実行に役立ちます。
         * 一般に、この時点まで作業を遅らせるようにする必要があります。
         * [参考](https://developers.google.com/web/fundamentals/web-components/customelements?hl=ja)
         */
        connectedCallback() {
            this.classList.add('views', 'z-depth-1');
        }

        /**
         * 子要素を追加する。View以外は無視。
         * @param newChild {ListView,IconView, CurationListView} 子要素
         */
        appendChild(newChild) {
            if (newChild instanceof ListView || newChild instanceof IconView || newChild instanceof CurationListView) {
                super.appendChild(newChild);
            }
        }
    }

    customElements.define("view-s", Views);

    /**
     * ビューアの基礎
     */
    class BasicViewer extends HTMLElement {
        constructor() {
            super();
        }

        cropping() {
            if (this.oncrop) {
                this.oncrop = false;
            } else {
                this.oncrop = true;
            }
            this.croppingIcon.classList.toggle('available');
        }
    }

    customElements.define('basic-viewer', BasicViewer);

    /**
     * ビューア本体
     */
    class IIIFMangaViewer extends BasicViewer {
        constructor(url) {
            super();
            if (url) {
                this.setAttribute('manifest', url);
            }
            // this.initialize();
        }

        /**
         * 要素が DOM から削除されるたびに呼び出されます。
         * クリーンアップ コードの実行（イベント リスナーの削除など）に役立ちます。
         * [参考](https://developers.google.com/web/fundamentals/web-components/customelements?hl=ja)
         */
        disconnectedCallback() {
            // メモリ開放
            this.viewer.free();
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
        }

        /**
         * 要素が DOM に挿入されるたびに呼び出されます。
         * リソースの取得やレンダリングなどの、セットアップ コードの実行に役立ちます。
         * 一般に、この時点まで作業を遅らせるようにする必要があります。
         * [参考](https://developers.google.com/web/fundamentals/web-components/customelements?hl=ja)
         */
        connectedCallback() {
            viewerCounter++;

            // card
            this.classList.add('card');

            // canvasを設定
            // const canvas = document.createElement('canvas');
            // this.appendChild(canvas);
            const viewerCanvas = new ViewerCanvas(this);
            this.viewerCanvas = viewerCanvas;
            this.appendChild(viewerCanvas);

            // navbar
            let viewDropdownTrigger, filterDropdownTrigger, filterDropdown;
            const navBar = document.createElement('nav');
            {
                const navWrapper = document.createElement('div');
                navWrapper.classList.add('nav-wrapper');

                const ulL = document.createElement('ul');
                ulL.classList.add('left', 'toolbar-icons');
                {
                    const id = 'views-dropdown' + viewerCounter;

                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    viewDropdownTrigger = a;
                    a.classList.add('dropdown-trigger');
                    a.setAttribute('data-target', id);
                    a.innerHTML = '<i class="material-icons">menu</i>';
                    li.appendChild(a);
                    ulL.appendChild(li);

                    const dropdown = document.createElement('ul');
                    dropdown.classList.add('dropdown-content');
                    dropdown.id = id;
                    {
                        const li = document.createElement('li');
                        const a = document.createElement('a');
                        a.classList.add('close');
                        a.innerHTML =
                            '<i class="material-icons">close</i>Close';
                        a.onclick = () => {
                            this.remove();
                        };
                        li.appendChild(a);
                        dropdown.appendChild(li);
                    }

                    navBar.appendChild(dropdown);
                }
                {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.classList.add('available');
                    a.innerHTML =
                        '<i class="material-icons">view_list</i>';
                    a.onclick = () => {
                        this.listView.onOff();
                    };
                    this.listViewIcon = a;
                    li.appendChild(a);
                    ulL.appendChild(li);
                }
                {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.innerHTML =
                        '<i class="material-icons">view_module</i>';
                    a.onclick = () => {
                        this.iconView.onOff();
                    };
                    this.iconViewIcon = a;
                    li.appendChild(a);
                    ulL.appendChild(li);
                }
                navWrapper.appendChild(ulL);

                const label = document.createElement('span');
                this.label = label;
                navWrapper.appendChild(label);

                const ulR = document.createElement('ul');
                ulR.classList.add('right', 'toolbar-icons');
                {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.innerHTML =
                        '<i class="material-icons">crop</i>';
                    this.croppingIcon = a;
                    a.onclick = () => {
                        this.cropping();
                    };
                    li.appendChild(a);
                    ulR.appendChild(li);
                }
                {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.innerHTML =
                        '<i class="material-icons">save_alt</i>';
                    a.onclick = () => {
                        let base64ToBlob = (base64) => {
                            let blob;
                            let bin = atob(base64.replace(/^.*,/, ""));
                            let buffer = new Uint8Array(bin.length);
                            for (let i = 0; i < bin.length; i++) {
                                buffer[i] = bin.charCodeAt(i);
                            }
                            // Blobを作成
                            try {
                                blob = new Blob([buffer.buffer], {
                                    type: "image/png"
                                });
                            } catch (e) {
                                return false;
                            }
                            return blob;
                        };

                        const image = viewerCanvas.image;
                        const canvas = document.createElement('canvas');
                        canvas.width = image.naturalWidth;
                        canvas.height = image.naturalHeight;
                        canvas.getContext("2d").drawImage(image, 0, 0);

                        const link = document.createElement('a');
                        link.style.display = 'none';
                        const base64 = canvas.toDataURL('image/png').split(',')[1];
                        link.href = window.URL.createObjectURL(base64ToBlob(base64));
                        link.download = this.viewer.label() + ' ' + this.viewer.index + '.png';
                        document.body.appendChild(link);

                        link.click();
                    };
                    li.appendChild(a);
                    ulR.appendChild(li);
                }
                {
                    const id = 'filters-dropdown' + viewerCounter;

                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    filterDropdownTrigger = a;
                    a.classList.add('dropdown-trigger');
                    a.setAttribute('data-target', id);
                    a.innerHTML =
                        '<i class="material-icons">tune</i>';
                    li.appendChild(a);
                    ulR.appendChild(li);

                    // dropdown-content
                    const dropdown = document.createElement('ul');
                    filterDropdown = dropdown;
                    dropdown.id = id;
                    dropdown.classList.add('dropdown-content', 'filter-dropdown');
                    let brightness, contrast, gradient, greyscale, invert;
                    let onchange = () => {
                        viewerCanvas.style.filter =
                            'brightness(' + brightness.value + '%) ' +
                            'contrast(' + contrast.value + '%) ' +
                            'grayscale(' + greyscale.value + '%) ' +
                            'saturate(' + gradient.value + '%) ' +
                            'invert(' + invert.value + '%) ';
                    };
                    {
                        // brightness
                        const li = document.createElement('li');
                        li.innerHTML =
                            '<div class="input-field">' +
                            '   <i class="material-icons prefix">brightness_low</i> ' +
                            '   <form action="#">' +
                            '       <label>Brightness</label>' +
                            '       <p class="range-field">' +
                            '           <input type="range" value="100" min="0" max="200" />' +
                            '       </p>' +
                            '   </form>' +
                            '</div>';
                        brightness = li.querySelector('input');
                        brightness.oninput = () => {
                            onchange();
                        };
                        dropdown.appendChild(li);
                    }
                    {
                        // contrast
                        const li = document.createElement('li');
                        li.innerHTML =
                            '<div class="input-field">' +
                            '   <i class="material-icons prefix">brightness_medium</i> ' +
                            '   <form action="#">' +
                            '       <label>Contrast</label>' +
                            '       <p class="range-field">' +
                            '           <input type="range" value="100" min="0" max="200" />' +
                            '       </p>' +
                            '   </form>' +
                            '</div>';
                        contrast = li.querySelector('input');
                        contrast.oninput = () => {
                            onchange();
                        };
                        dropdown.appendChild(li);
                    }
                    {
                        // gradient
                        const li = document.createElement('li');
                        li.innerHTML =
                            '<div class="input-field">' +
                            '   <i class="material-icons prefix">gradient</i> ' +
                            '   <form action="#">' +
                            '       <label>Gradient</label>' +
                            '       <p class="range-field">' +
                            '           <input type="range" value="100" min="0" max="100" />' +
                            '       </p>' +
                            '   </form>' +
                            '</div>';
                        gradient = li.querySelector('input');
                        gradient.oninput = () => {
                            onchange();
                        };
                        dropdown.appendChild(li);
                    }
                    {
                        // greyscale
                        const li = document.createElement('li');
                        li.innerHTML =
                            '<div class="input-field">' +
                            '   <i class="material-icons prefix">filter_b_and_w</i> ' +
                            '   <form action="#">' +
                            '       <label>Greyscale</label>' +
                            '       <p class="range-field">' +
                            '           <input type="range" value="0" min="0" max="100" />' +
                            '       </p>' +
                            '   </form>' +
                            '</div>';
                        greyscale = li.querySelector('input');
                        greyscale.oninput = () => {
                            onchange();
                        };
                        dropdown.appendChild(li);
                    }
                    {
                        // invert
                        const li = document.createElement('li');
                        li.innerHTML =
                            '<div class="input-field">' +
                            '   <i class="material-icons prefix">invert_colors</i> ' +
                            '   <form action="#">' +
                            '       <label>Invert</label>' +
                            '       <p class="range-field">' +
                            '           <input type="range" value="0" min="0" max="100" />' +
                            '       </p>' +
                            '   </form>' +
                            '</div>';
                        invert = li.querySelector('input');
                        invert.oninput = () => {
                            onchange();
                        };
                        dropdown.appendChild(li);
                    }
                    navBar.appendChild(dropdown);
                }
                navWrapper.appendChild(ulR);

                navBar.appendChild(navWrapper);
            }
            this.appendChild(navBar);

            M.Dropdown.init(viewDropdownTrigger, {
                constrainWidth: false,
                coverTrigger: false,
                closeOnClick: false,
            });
            M.Dropdown.init(filterDropdownTrigger, {
                alignment: 'right',
                constrainWidth: false,
                coverTrigger: false,
                closeOnClick: false,
                onOpenEnd: () => {
                    filterDropdown.style.width = '400px';
                    M.Range.init(filterDropdown.querySelectorAll('input[type="range"]'), {});
                },
            });

            // viewsを設定
            const views = document.createElement('view-s');
            this.views = views;
            this.appendChild(views);

            // ListViewを設定
            const listView = document.createElement('ul', {is: "image-list"});
            this.listView = listView;
            views.appendChild(listView);

            // IconViewを設定
            const iconView = document.createElement('icon-view');
            this.iconView = iconView;
            views.appendChild(iconView);


            // viewerを設定
            this.viewer = new Viewer(viewerCanvas, listView, iconView);

            const manifestURL = this.getAttribute('manifest');
            if (manifestURL) {
                fetch(manifestURL).then((response) => {
                    return response.text();
                }).then((text) => {
                    if (!this.viewer.set_manifest(text)) {
                        // manifestの読み取りに失敗すると消える
                        this.remove();
                    }

                    // navigationを設定
                    this.label.innerHTML = this.viewer.label();

                    this.show(0);

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
                });
            }
        }

        cropping() {
            if (this.oncrop) {
                this.oncrop = false;
            } else {
                this.oncrop = true;
            }
            this.croppingIcon.classList.toggle('available');
        }

        progress() {
            let div = document.createElement('div');
            div.innerHTML =
                "<div class=\"progress\" style='position: absolute;top: 50%;left: 50%; width: 50%;transform: translate(-50%, -50%);'>\n" +
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

        // 表示中のイメージを動かす
        move(newX, newY) {
            let image = this.viewerCanvas.getImage();
            image.style.transform = 'translate(' + newX + 'px,' + newY + 'px)';
        }
    }

    customElements.define("iiif-manga-viewer", IIIFMangaViewer);

    /**
     * キュレーション用ListViewItem
     */
    class CurationListViewItem extends HTMLLIElement {
        /**
         *
         * @param item {CurationItem}
         * @param imageViewer {CurationViewer}
         * @param curationList {CurationListView}
         */
        constructor(item, imageViewer, curationList) {
            super();
            this.item = item;
            this.imageViewer = imageViewer;
            this.curationList = curationList;

            // 必要なclassを追加
            this.classList.add('collection-item', 'curation-list-item');

            this.onclick = () => {
                // 表示
                this.imageViewer.show(this.item);
                // deactivate
                this.curationList.deactivate();
                // activate
                this.classList.toggle('active');
            }
        }

        /**
         * 要素が DOM から削除されるたびに呼び出されます。
         * クリーンアップ コードの実行（イベント リスナーの削除など）に役立ちます。
         * [参考](https://developers.google.com/web/fundamentals/web-components/customelements?hl=ja)
         */
        disconnectedCallback() {
            // メモリ開放
            // this.item.free();
        }

        /**
         * 要素が DOM に挿入されるたびに呼び出されます。
         * リソースの取得やレンダリングなどの、セットアップ コードの実行に役立ちます。
         * 一般に、この時点まで作業を遅らせるようにする必要があります。
         * [参考](https://developers.google.com/web/fundamentals/web-components/customelements?hl=ja)
         */
        connectedCallback() {
            this.innerText = this.item.label();

            // todo 操作ボタンの配置
        }
    }

    customElements.define('curation-list-item', CurationListViewItem, {extends: 'li'});

    /**
     * キュレーション用ListView
     */
    class CurationListView extends HTMLUListElement {
        constructor(imageViewer) {
            super();

            // 必要なclassを追加
            this.classList.add('collection', 'with-header', 'curation-list');

            this.curationViewer = imageViewer;
        }

        onOff() {
            this.classList.toggle('hide');

            const a = this.curationViewer.listViewIcon;
            if (!this.classList.contains('hide')) {
                a.classList.add('available');
            } else {
                a.classList.remove('available');
            }
        }

        /**
         * 要素が DOM に挿入されるたびに呼び出されます。
         * リソースの取得やレンダリングなどの、セットアップ コードの実行に役立ちます。
         * 一般に、この時点まで作業を遅らせるようにする必要があります。
         * [参考](https://developers.google.com/web/fundamentals/web-components/customelements?hl=ja)
         */
        connectedCallback() {
            this.sortable = Sortable.create(this, {
                onEnd: (evt) => {
                    if (!this.curationViewer.swap(evt.oldIndex, evt.newIndex)) {
                        M.Toast({html: '<i class="material-icons error left">error</i>Swap Failed'});
                    }
                    console.log(this.curationViewer.viewer.json());
                }
            })
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
         * 子要素を追加する。
         * @param newChild {CurationItem} リストの子要素の元となるデータ
         */
        appendChild(newChild) {
            if (newChild instanceof CurationItem) {
                const child = new CurationListViewItem(newChild, this.curationViewer, this);
                super.appendChild(child);
            }
        }

        getChild(index) {
            return this.querySelectorAll('.image-list-item')[index];
        }
    }

    customElements.define('curation-list', CurationListView, {extends: 'ul'});

    /**
     * キュレーション一覧
     */
    class CurationViewer extends BasicViewer {
        static curationViewer = undefined;

        constructor() {
            super();
        }

        /**
         * 要素が DOM から削除されるたびに呼び出されます。
         * クリーンアップ コードの実行（イベント リスナーの削除など）に役立ちます。
         * [参考](https://developers.google.com/web/fundamentals/web-components/customelements?hl=ja)
         */
        disconnectedCallback() {
            // メモリ開放
            this.viewer.free();
        }

        /**
         * 要素が DOM に挿入されるたびに呼び出されます。
         * リソースの取得やレンダリングなどの、セットアップ コードの実行に役立ちます。
         * 一般に、この時点まで作業を遅らせるようにする必要があります。
         * [参考](https://developers.google.com/web/fundamentals/web-components/customelements?hl=ja)
         */
        connectedCallback() {
            viewerCounter++;

            // 一番最初にDOMに挿入されたCurationViewerが規定のCurationViewerになる
            if (!CurationViewer.curationViewer) {
                CurationViewer.curationViewer = this;
                this.classList.add('default', 'hide');
            }

            // card
            this.classList.add('card');

            // canvasを設定
            const viewerCanvas = new ViewerCanvas(this);
            this.viewerCanvas = viewerCanvas;
            this.appendChild(viewerCanvas);

            // navbar
            let viewDropdownTrigger, filterDropdownTrigger, filterDropdown;
            const navBar = document.createElement('nav');
            {
                const navWrapper = document.createElement('div');
                navWrapper.classList.add('nav-wrapper');

                const ulL = document.createElement('ul');
                ulL.classList.add('left', 'toolbar-icons');
                {
                    const id = 'views-dropdown' + viewerCounter;

                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    viewDropdownTrigger = a;
                    a.classList.add('dropdown-trigger');
                    a.setAttribute('data-target', id);
                    a.innerHTML = '<i class="material-icons">menu</i>';
                    li.appendChild(a);
                    ulL.appendChild(li);

                    const dropdown = document.createElement('ul');
                    dropdown.classList.add('dropdown-content');
                    dropdown.id = id;
                    {
                        const li = document.createElement('li');
                        const a = document.createElement('a');
                        a.classList.add('close');
                        a.innerHTML =
                            '<i class="material-icons">close</i>Close';
                        if (CurationViewer.curationViewer === this) {
                            a.onclick = () => {
                                this.classList.toggle('hide');
                            };
                        } else {
                            a.onclick = () => {
                                this.remove();
                            };
                        }
                        li.appendChild(a);
                        dropdown.appendChild(li);
                    }
                    {
                        const li = document.createElement('li');
                        const a = document.createElement('a');
                        a.classList.add('save_json');
                        a.innerHTML =
                            '<i class="material-icons">save</i>Save Curation';
                        a.onclick = () => {
                            const jsonBlob = new Blob([this.viewer.json()], {type: "text/plain;charset=utf-8"});

                            const link = document.createElement('a');
                            link.classList.add('hide');
                            document.body.appendChild(link);

                            link.href = URL.createObjectURL(jsonBlob);
                            link.download = 'Curation.json';

                            link.click();

                            link.remove();
                        };
                        li.appendChild(a);
                        dropdown.appendChild(li);
                    }

                    navBar.appendChild(dropdown);
                }
                {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.classList.add('available');
                    a.innerHTML =
                        '<i class="material-icons">view_list</i>';
                    a.onclick = () => {
                        this.listView.onOff();
                    };
                    this.listViewIcon = a;
                    li.appendChild(a);
                    ulL.appendChild(li);
                }
                navWrapper.appendChild(ulL);

                const label = document.createElement('span');
                if (CurationViewer.curationViewer === this) {
                    label.innerText = 'Curation Viewer (Default)';
                } else {
                    label.innerText = 'Curation Viewer';
                }
                this.label = label;
                navWrapper.appendChild(label);

                const ulR = document.createElement('ul');
                ulR.classList.add('right', 'toolbar-icons');
                {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.innerHTML =
                        '<i class="material-icons">crop</i>';
                    this.croppingIcon = a;
                    a.onclick = () => {
                        this.cropping();
                    };
                    li.appendChild(a);
                    ulR.appendChild(li);
                }
                {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.innerHTML =
                        '<i class="material-icons">save_alt</i>';
                    a.onclick = () => {
                        let base64ToBlob = (base64) => {
                            let blob;
                            let bin = atob(base64.replace(/^.*,/, ""));
                            let buffer = new Uint8Array(bin.length);
                            for (let i = 0; i < bin.length; i++) {
                                buffer[i] = bin.charCodeAt(i);
                            }
                            // Blobを作成
                            try {
                                blob = new Blob([buffer.buffer], {
                                    type: "image/png"
                                });
                            } catch (e) {
                                return false;
                            }
                            return blob;
                        };

                        const image = viewerCanvas.image;
                        const canvas = document.createElement('canvas');
                        canvas.width = image.naturalWidth;
                        canvas.height = image.naturalHeight;
                        canvas.getContext("2d").drawImage(image, 0, 0);

                        const link = document.createElement('a');
                        link.style.display = 'none';
                        const base64 = canvas.toDataURL('image/png').split(',')[1];
                        link.href = window.URL.createObjectURL(base64ToBlob(base64));
                        link.download = this.viewer.label() + ' ' + this.viewer.index + '.png';
                        document.body.appendChild(link);

                        link.click();
                    };
                    li.appendChild(a);
                    ulR.appendChild(li);
                }
                {
                    const id = 'filters-dropdown' + viewerCounter;

                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    filterDropdownTrigger = a;
                    a.classList.add('dropdown-trigger');
                    a.setAttribute('data-target', id);
                    a.innerHTML =
                        '<i class="material-icons">tune</i>';
                    li.appendChild(a);
                    ulR.appendChild(li);

                    // dropdown-content
                    const dropdown = document.createElement('ul');
                    filterDropdown = dropdown;
                    dropdown.id = id;
                    dropdown.classList.add('dropdown-content', 'filter-dropdown');
                    let brightness, contrast, gradient, greyscale, invert;
                    let onchange = () => {
                        viewerCanvas.style.filter =
                            'brightness(' + brightness.value + '%) ' +
                            'contrast(' + contrast.value + '%) ' +
                            'grayscale(' + greyscale.value + '%) ' +
                            'saturate(' + gradient.value + '%) ' +
                            'invert(' + invert.value + '%) ';
                    };
                    {
                        // brightness
                        const li = document.createElement('li');
                        li.innerHTML =
                            '<div class="input-field">' +
                            '   <i class="material-icons prefix">brightness_low</i> ' +
                            '   <form action="#">' +
                            '       <label>Brightness</label>' +
                            '       <p class="range-field">' +
                            '           <input type="range" value="100" min="0" max="200" />' +
                            '       </p>' +
                            '   </form>' +
                            '</div>';
                        brightness = li.querySelector('input');
                        brightness.oninput = () => {
                            onchange();
                        };
                        dropdown.appendChild(li);
                    }
                    {
                        // contrast
                        const li = document.createElement('li');
                        li.innerHTML =
                            '<div class="input-field">' +
                            '   <i class="material-icons prefix">brightness_medium</i> ' +
                            '   <form action="#">' +
                            '       <label>Contrast</label>' +
                            '       <p class="range-field">' +
                            '           <input type="range" value="100" min="0" max="200" />' +
                            '       </p>' +
                            '   </form>' +
                            '</div>';
                        contrast = li.querySelector('input');
                        contrast.oninput = () => {
                            onchange();
                        };
                        dropdown.appendChild(li);
                    }
                    {
                        // gradient
                        const li = document.createElement('li');
                        li.innerHTML =
                            '<div class="input-field">' +
                            '   <i class="material-icons prefix">gradient</i> ' +
                            '   <form action="#">' +
                            '       <label>Gradient</label>' +
                            '       <p class="range-field">' +
                            '           <input type="range" value="100" min="0" max="100" />' +
                            '       </p>' +
                            '   </form>' +
                            '</div>';
                        gradient = li.querySelector('input');
                        gradient.oninput = () => {
                            onchange();
                        };
                        dropdown.appendChild(li);
                    }
                    {
                        // greyscale
                        const li = document.createElement('li');
                        li.innerHTML =
                            '<div class="input-field">' +
                            '   <i class="material-icons prefix">filter_b_and_w</i> ' +
                            '   <form action="#">' +
                            '       <label>Greyscale</label>' +
                            '       <p class="range-field">' +
                            '           <input type="range" value="0" min="0" max="100" />' +
                            '       </p>' +
                            '   </form>' +
                            '</div>';
                        greyscale = li.querySelector('input');
                        greyscale.oninput = () => {
                            onchange();
                        };
                        dropdown.appendChild(li);
                    }
                    {
                        // invert
                        const li = document.createElement('li');
                        li.innerHTML =
                            '<div class="input-field">' +
                            '   <i class="material-icons prefix">invert_colors</i> ' +
                            '   <form action="#">' +
                            '       <label>Invert</label>' +
                            '       <p class="range-field">' +
                            '           <input type="range" value="0" min="0" max="100" />' +
                            '       </p>' +
                            '   </form>' +
                            '</div>';
                        invert = li.querySelector('input');
                        invert.oninput = () => {
                            onchange();
                        };
                        dropdown.appendChild(li);
                    }
                    navBar.appendChild(dropdown);
                }
                navWrapper.appendChild(ulR);

                navBar.appendChild(navWrapper);
            }
            this.appendChild(navBar);

            M.Dropdown.init(viewDropdownTrigger, {
                constrainWidth: false,
                coverTrigger: false,
                closeOnClick: false,
            });
            M.Dropdown.init(filterDropdownTrigger, {
                alignment: 'right',
                constrainWidth: false,
                coverTrigger: false,
                closeOnClick: false,
                onOpenEnd: () => {
                    filterDropdown.style.width = '400px';
                    M.Range.init(filterDropdown.querySelectorAll('input[type="range"]'), {});
                },
            });

            // todo listview, iconviewを設定
            const views = new Views();
            this.appendChild(views);
            this.views = views;

            const listView = new CurationListView(this);
            views.appendChild(listView);
            this.listView = listView;

            // viewerを設定
            this.viewer = new WasmCurationViewer(this.viewerCanvas);
        }

        cropping() {
            if (this.oncrop) {
                this.oncrop = false;
            } else {
                this.oncrop = true;
            }
            this.croppingIcon.classList.toggle('available');
        }

        /**
         * 指定されたデータを持つitemを表示する
         * @param item {CurationItem}
         */
        show(item) {
            let index = this.viewer.show(item);
            this.listView.activate(index);
        }

        /**
         * 要素を追加する
         * @param item {CurationItem}
         */
        push = (item) => {
            this.viewer.push(item);
            this.viewer.show_last();

            this.listView.appendChild(item);

            this.classList.remove('hide');
        }

        /**
         * 要素の順序を入れ替える
         * @param oldindex
         * @param newindex
         * @return {boolean}
         */
        swap = (oldindex, newindex) => {
            return this.viewer.swap(oldindex, newindex)
        }

        fromJson = (jsonText) => {
            if (CurationViewer.curationViewer === this) {
                return;
            }
            if (this.viewer.set_items(jsonText)) {
                let promises = [];
                for (let i = 0; i < this.viewer.size(); i++) {
                    const promise = new Promise(() => {
                        let item = this.viewer.get(i);
                        const image = document.createElement('img');
                        image.crossOrigin = "Anonymous";
                        image.src = item.image_id();
                        image.onload = () => {
                            let canvas = document.createElement('canvas');
                            let [sx, sy, sw, sh, dx, dy, dw, dh] =
                                [
                                    item.get_x_start(),
                                    item.get_y_start(),
                                    item.get_x_end() - item.get_x_start(),
                                    item.get_y_end() - item.get_y_start(),
                                    0,
                                    0,
                                    item.get_x_end() - item.get_x_start(),
                                    item.get_y_end() - item.get_y_start()
                                ];
                            canvas.width = dw;
                            canvas.height = dh;
                            canvas.getContext('2d').drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);

                            let img = new Image();
                            img.src = canvas.toDataURL('image/png');

                            item.set_image(img);
                            this.push(item);
                            // resolve(item.label());
                        }
                    });
                    promises.push(promise);
                }

                Promise.all(promises);

            } else {
                M.Toast({html: '<i class="material-icons error left">error</i>Parse Failed'});
                this.remove();
            }
        }

        move(newX, newY) {
            let image = this.viewerCanvas.getImage();
            image.style.transform = 'translate(' + newX + 'px,' + newY + 'px)';
        }
    }

    customElements.define('curation-viewer', CurationViewer);

    /**
     * 検索バー
     */
    class SearchBar extends HTMLElement {
        constructor(cards) {
            super();
            this.cards = cards;
        }

        /**
         * 要素が DOM に挿入されるたびに呼び出されます。
         * リソースの取得やレンダリングなどの、セットアップ コードの実行に役立ちます。
         * 一般に、この時点まで作業を遅らせるようにする必要があります。
         * [参考](https://developers.google.com/web/fundamentals/web-components/customelements?hl=ja)
         */
        connectedCallback() {
            let themeSelect, sortSelect, sortOrderDesc, sortOrderAsc, rowsInput;

            // card
            this.classList.add('card');

            // content
            const content = document.createElement('div');
            content.classList.add('card-content');
            this.content = content;
            super.appendChild(content);

            // footer
            const footer = document.createElement('div');
            footer.classList.add('card-action', 'hide');
            this.footer = footer;
            super.appendChild(footer);
            // search button
            const searchButton = document.createElement('a');
            searchButton.classList.add('btn', 'right');
            searchButton.innerHTML =
                '<i class="material-icons left">search</i>Search';
            footer.appendChild(searchButton);
            searchButton.onclick = () => {
                this.search();
            };


            // 検索バーの設置
            const div = document.createElement('div');
            div.innerHTML =
                '<div class="input-field search_field">\n' +
                '   <i class="material-icons prefix">search</i>\n' +
                '   <input id="icon_query" type="text" class="validate">\n' +
                '   <label for="icon_query">Search with...</label>\n' +
                '</div>';
            const search_field = div.firstElementChild;
            this.search_field = search_field;

            search_field.onkeypress = (event) => {
                switch (event.key) {
                    case 'Enter':
                        this.search();
                        break;
                }
            };
            this.appendChild(search_field);

            // ドロップダウンボタン
            let dropdownSwitch = document.createElement('div');
            dropdownSwitch.innerHTML =
                '<div class="switch">\n' +
                '    show details' +
                '    <label>\n' +
                '      <input type="checkbox">\n' +
                '      <span class="lever"></span>\n' +
                '    </label>\n' +
                '</div>';
            dropdownSwitch.classList.add('right-align');
            this.appendChild(dropdownSwitch);

            // ドロップダウン
            const dropdown = document.createElement('div');
            dropdown.classList.add('dropdown', 'hide');
            this.appendChild(dropdown);
            {
                let theme = document.createElement('div');
                theme.innerHTML =
                    '<div class="input-field">\n' +
                    '   <i class="material-icons prefix">label</i>\n' +
                    '   <select>\n' +
                    '      <option value="" disabled selected>None</option>\n' +
                    '      <option value="archaelogy">archaelogy</option>\n' +
                    '      <option value="art">art</option>\n' +
                    '      <option value="fashion">fashion</option>\n' +
                    '      <option value="manuscript">manuscript</option>\n' +
                    '      <option value="map">map</option>\n' +
                    '      <option value="migration">migration</option>\n' +
                    '      <option value="music">music</option>\n' +
                    '      <option value="nature">nature</option>\n' +
                    '      <option value="newspaper">newspaper</option>\n' +
                    '      <option value="photography">photography</option>\n' +
                    '      <option value="ww1">ww1</option>\n' +
                    '    </select>\n' +
                    '    <label>Theme</label>' +
                    '</div>';
                theme = theme.firstElementChild;
                dropdown.appendChild(theme);
                themeSelect = theme.querySelector('select');
                M.FormSelect.init(themeSelect, {});
            }
            {
                let sort = document.createElement('div');
                sort.innerHTML =
                    '<div class="input-field">\n' +
                    '   <i class="material-icons prefix">sort</i>\n' +
                    '   <select>\n' +
                    '      <option value="" disabled selected>None</option>\n' +
                    '      <option value="timestamp_created">timestamp_created</option>\n' +
                    '      <option value="timestamp_update">timestamp_update</option>\n' +
                    '      <option value="europeana_id">europeana_id</option>\n' +
                    '      <option value="COMPLETENESS">COMPLETENESS</option>\n' +
                    '      <option value="is_fulltext">is_fulltext</option>\n' +
                    '      <option value="has_thumbnails">has_thumbnails</option>\n' +
                    '      <option value="has_media">has_media</option>\n' +
                    '    </select>\n' +
                    '    <label>Sort</label>' +
                    '</div>';
                sort = sort.firstElementChild;
                dropdown.appendChild(sort);
                sortSelect = sort.querySelector('select');
                M.FormSelect.init(sortSelect, {});
            }
            {
                let sortOrder = document.createElement('div');
                sortOrder.classList.add('right-align');
                sortOrder.innerHTML =
                    '<div class="right-align">' +
                    '<form action="#">\n' +
                    '   <label>\n' +
                    '       <input name="sort_order" type="radio" checked />\n' +
                    '       <span>ascending</span>\n' +
                    '   </label>\n' +
                    '   <label>\n' +
                    '       <input name="sort_order" type="radio" />\n' +
                    '       <span>descending</span>\n' +
                    '   </label>\n' +
                    '</form>' +
                    '</div>';
                sortOrder = sortOrder.firstElementChild;
                dropdown.appendChild(sortOrder);
                // sortSelect = sort.querySelectorAll('select');
                sortOrderAsc = sortOrder.querySelectorAll('input[type="radio"]')[0];
                sortOrderDesc = sortOrder.querySelectorAll('input[type="radio"]')[1];
            }
            {
                let rows = document.createElement('div');
                rows.classList.add('rows-wrapper', 'input-field');
                rows.innerHTML =
                    '<i class="material-icons prefix">data_usage</i> ' +
                    '<form action="#">\n' +
                    '   <label>Rows</label>' +
                    '   <p class="range-field">\n' +
                    '       <input type="range" value="10" min="0" max="100" />\n' +
                    '   </p>\n' +
                    '</form>';
                // rows = rows.firstElementChild;
                dropdown.appendChild(rows);
                rowsInput = rows.querySelector('input');
                M.Range.init(rowsInput, {});
            }

            // dropdown onclick
            dropdownSwitch.querySelector('input[type="checkbox"]').onclick = () => {
                dropdown.classList.toggle('hide');
                footer.classList.toggle('hide');
            };

            this.themeSelect = themeSelect;
            this.sortSelect = sortSelect;
            this.sortOrderDesc = sortOrderDesc;
            this.sortOrderAsc = sortOrderAsc;
            this.rowsInput = rowsInput;
        }

        search() {
            let themeSelect = this.themeSelect;
            let sortSelect = this.sortSelect;
            let sortOrderDesc = this.sortOrderDesc;
            let rowsInput = this.rowsInput;
            let search_field = this.search_field;

            const query = search_field.querySelector('#icon_query').value;
            if (!query) return;
            const searchQuery = new SearchQuery(query);

            // テーマ
            if (themeSelect.value) {
                searchQuery.set_theme(themeSelect.value);
            }
            // ソート
            if (sortSelect.value) {
                // order
                let order;
                if (sortOrderDesc.checked) {
                    order = 'desc';
                } else {
                    order = 'asc';
                }
                searchQuery.set_sort(sortSelect.value + '+' + order);
            }
            // 件数
            if (rowsInput.value) {
                let rows = Number(rowsInput.value);
                if (rows < 0) rows = 10;
                searchQuery.set_rows(rows);
            }
            // todo post query
            let json = searchQuery.json();
            this.clear();
            // todo remove sample
            // サンプル出力
            let sample = new SearchResult("https://www.dl.ndl.go.jp/api/iiif/2542527/manifest.json",
                "会津日新館細江図",
                "要素が DOM に挿入されるたびに呼び出されます。\n" +
                "リソースの取得やレンダリングなどの、セットアップ コードの実行に役立ちます。\n" +
                "一般に、この時点まで作業を遅らせるようにする必要があります。\n" +
                "[参考](https://developers.google.com/web/fundamentals/web-components/customelements?hl=ja)",
                "https://www.dl.ndl.go.jp/api/iiif/2542527/T0000001/full/full/0/default.jpg");
            let sample1 = new SearchResult("https://www.dl.ndl.go.jp/api/iiif/2532216/manifest.json",
                "あいご十二段",
                "インターネット公開（保護期間満了）",
                "https://www.dl.ndl.go.jp/api/iiif/2532216/T0000001/full/full/0/default.jpg");
            let sample2 = new SearchResult('http://www2.dhii.jp/nijl/NIJL0008/NA4-0644/manifest.json',
                '絵本松の調',
                '勝川春章 画',
                undefined);
            const sampleCard = new SearchCard(sample);
            const sampleCard1 = new SearchCard(sample1);
            const sampleCard2 = new SearchCard(sample2);
            this.appendCard(sampleCard);
            this.appendCard(sampleCard1);
            this.appendCard(sampleCard2);

            // const url = '/search';
            // const headers = {
            //     'Accept': 'application/json',
            //     'Content-Type': 'application/json'
            // };
            // fetch(url, {
            //     method: 'POST',
            //     headers,
            //     body: json,
            // }).then(res => {
            //     return res.text()
            // }).then(text => {
            //     const results = new SearchResults(text);
            //     if (!results) return;
            //     for (let i = 0; i < results.len(); i++) {
            //         const result = results.get(i);
            //         console.log(result.url());
            //         this.appendCard(new SearchCard(result));
            //     }
            // }).catch(err => {
            // })
        }

        /**
         * 前回の検索結果を消去する
         */
        clear() {
            this.cards.innerHTML = '';
        }

        appendChild(newChild) {
            this.content.appendChild(newChild);
        }

        appendCard(newCard) {
            this.cards.appendChild(newCard);
        }
    }

    customElements.define('search-bar', SearchBar);

    /**
     * Manifestの検索結果(1件)
     */
    class SearchCard extends HTMLElement {
        /**
         *
         * @param result {SearchResult}
         */
        constructor(result) {
            super();
            this.result = result;
        }

        /**
         * 要素が DOM に挿入されるたびに呼び出されます。
         * リソースの取得やレンダリングなどの、セットアップ コードの実行に役立ちます。
         * 一般に、この時点まで作業を遅らせるようにする必要があります。
         * [参考](https://developers.google.com/web/fundamentals/web-components/customelements?hl=ja)
         */
        connectedCallback() {
            // card
            this.classList.add('card');
            const cardImage = document.createElement('div');
            cardImage.classList.add('card-image');
            {
                const img = document.createElement('img');
                if (this.result.thumbnail()) {
                    img.src = this.result.thumbnail();
                } else {
                    img.src = 'https://material.io/tools/icons/static/icons/baseline-collections-24px.svg';
                }
                cardImage.appendChild(img);
            }
            {
                const span = document.createElement('span');
                span.classList.add('card-title');
                span.innerHTML = this.result.title();
                cardImage.appendChild(span);
            }
            {
                const fab = document.createElement('a');
                fab.classList.add('btn-floating', 'halfway-fab', 'waves-effect', 'waves-light', 'btn-large');
                fab.innerHTML = '<i class="material-icons">launch</i>';
                cardImage.appendChild(fab);

                // onclick
                fab.onclick = () => {
                    open(this.result.url());
                };
            }
            this.appendChild(cardImage);

            const cardContent = document.createElement('div');
            cardContent.classList.add('card-content');
            cardContent.innerHTML = this.result.description();
            this.appendChild(cardContent);
        }
    }

    customElements.define('search-card', SearchCard);

    /**
     * Manifestの検索を行うmodal
     */
    class SearchModal extends HTMLElement {
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
            this.classList.add('modal');
            M.Modal.init(this, {});

            // content
            const content = document.createElement('div');
            content.classList.add('modal-content');
            this.content = content;
            super.appendChild(content);

            // title
            const title = document.createElement('h3');
            title.innerHTML =
                '<i class="material-icons left fontsize-inherit">storage</i>Search Manifest';
            this.appendChild(title);

            // cards
            const cards = document.createElement('div');
            cards.classList.add('cards');

            // 検索バーの設置
            const search_bar = new SearchBar(cards);
            this.appendChild(search_bar);
            // cardsの設置
            this.appendChild(cards);
        }

        appendChild(newChild) {
            this.content.appendChild(newChild);
        }
    }

    customElements.define("search-modal", SearchModal);

    /**
     * urlからManifestを開くmodal
     */
    class OpenModal extends HTMLElement {
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
            this.classList.add('modal');
            M.Modal.init(this, {});

            // content
            const content = document.createElement('div');
            content.classList.add('modal-content');
            this.content = content;
            super.appendChild(content);

            // title
            const title = document.createElement('h3');
            title.innerHTML =
                '<i class="material-icons left fontsize-inherit">open_in_browser</i>Open Manifest';
            this.appendChild(title);

            // url input
            const urlInput = document.createElement('div');
            urlInput.classList.add('input-field');
            urlInput.innerHTML =
                '<i class="material-icons prefix">open_in_browser</i>' +
                '<input id="url_input" type="url" class="validate">' +
                '<label for="url_input">URL</label>';
            this.appendChild(urlInput);

            const input = urlInput.querySelector('input');
            input.onkeypress = (event) => {
                switch (event.key) {
                    case 'Enter':
                        open(input.value);
                        M.Modal.getInstance(this).close();
                        break;
                }
            }
        }

        appendChild(newChild) {
            this.content.appendChild(newChild);
        }
    }

    customElements.define('open-modal', OpenModal);

    /**
     * ファイルを読み取ってCurationViewerを開くmodal
     */
    class OpenCurationModal extends HTMLElement {
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
            this.classList.add('modal');
            M.Modal.init(this, {});

            // content
            const content = document.createElement('div');
            content.classList.add('modal-content');
            this.content = content;
            super.appendChild(content);

            // title
            const title = document.createElement('h3');
            title.innerHTML =
                '<i class="material-icons left fontsize-inherit">description</i>Open Curation File';
            this.appendChild(title);

            // file input
            const fileInput = document.createElement('div');
            fileInput.classList.add('input-field', 'file-field');
            fileInput.innerHTML =
                '<div class="btn">\n' +
                '   <span><i class="material-icons">description</i></span>\n' +
                '   <input type="file" accept="application/json">\n' +
                '</div>\n' +
                '<div class="file-path-wrapper">\n' +
                '   <input class="file-path validate" type="text">\n' +
                '</div>';
            this.appendChild(fileInput);
            this.input = fileInput.querySelector('input[type="file"]');

            // footer
            const footer = document.createElement('div');
            footer.classList.add('modal-footer');
            this.footer = footer;
            super.appendChild(footer);

            // submit
            const a = document.createElement('a');
            a.classList.add('modal-close', 'waves-effect', 'waves-blue', 'btn-flat', 'secondary-color');
            a.innerHTML =
                '<i class="material-icons left">description</i>Open';
            a.onclick = () => {
                let reader = new FileReader();
                reader.readAsText(this.input.files[0]);
                reader.onload = () => {
                    const cv = new CurationViewer();
                    document.getElementById('viewers').appendChild(cv);
                    cv.fromJson(reader.result);
                }
            };
            this.footerAppendChild(a);
        }

        appendChild(newChild) {
            this.content.appendChild(newChild);
        }

        footerAppendChild(newChild) {
            this.footer.appendChild(newChild);
        }
    }

    customElements.define('open-curation-modal', OpenCurationModal);

}

run();