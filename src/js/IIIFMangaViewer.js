import init, {
    Viewer,
    Direction,
    SearchQuery,
    SearchResult,
    SearchResults
} from '../../pkg/iiif_manga_viewer_frontend.js';

let open = (url) => {
    const viewers = document.getElementById('viewers');
    let viewer = document.createElement('div');
    viewer.innerHTML = '<div is="iiif-manga-viewer" manifest="' + url + '"></div>';
    viewer = viewer.firstElementChild;
    viewers.appendChild(viewer);
};

async function run() {
    await init();

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
                a.classList.add('view-available');
            } else {
                a.classList.remove('view-available');
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
                a.classList.add('view-available');
            } else {
                a.classList.remove('view-available');
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
         * @param newChild {ListView,IconView} 子要素
         */
        appendChild(newChild) {
            if (newChild instanceof ListView || newChild instanceof IconView || newChild instanceof SearchModal) {
                super.appendChild(newChild);
            }
        }
    }

    customElements.define("view-s", Views);

    /**
     * ビューア本体
     */
    class IIIFMangaViewer extends HTMLDivElement {
        constructor() {
            console.log('constructor');
            super();
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

            // 子要素をすべて削除
            this.textContent = null;

            // card
            this.classList.add('card');

            // canvasを設定
            const canvas = document.createElement('canvas');
            this.appendChild(canvas);

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
                    a.classList.add('view-available');
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
                        canvas.style.filter =
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
            this.viewer = new Viewer(canvas, listView, iconView);
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
            let label = this.viewer.label();
            console.log('JS: show():' + label);
            // this.viewer.label();
            if (!this.viewer.show(index)) {
                let progress = this.progress();
                let elem = this.viewer.get_image_elem(index);
                console.log('REQUEST: this.viewer.label=' + this.viewer.label());
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
            console.log(json);
            // todo remove sample
            console.log('sample output');
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

            const url = '';
            fetch(url, {
                method: 'POST',
                body: json,
            }).then(res => {
                return res.text()
            }).then(text => {
                const results = new SearchResults(text);
                if (!results) return;
                for (let i = 0; i < results.len(); i++) {
                    const result = results.get(i);
                }
            }).catch(err => {
            })
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
                fab.onclick = (event) => {
                    const viewers = document.getElementById('viewers');
                    let viewer = document.createElement('div');
                    viewer.innerHTML = '<div is="iiif-manga-viewer" manifest="' + this.result.url() + '"></div>';
                    viewer = viewer.firstElementChild;
                    viewers.appendChild(viewer);
                }
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
}

run();