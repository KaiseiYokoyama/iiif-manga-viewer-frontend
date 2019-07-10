use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

use web_sys::{Element, HtmlImageElement, HtmlCanvasElement, CanvasRenderingContext2d, MouseEvent, Node};

use js_sys::Promise;
use crate::iiif_manifest::Manifest;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    pub fn log(s: &str);
}

#[wasm_bindgen]
struct Viewer {
    canvas: Canvas,
    image_list: ImageList,
    images: Vec<ViewerImage>,
    manifest: Option<Manifest>,
    pub index: usize,
}

#[wasm_bindgen]
impl Viewer {
    #[wasm_bindgen(constructor)]
    /// Viewerのコンストラクタ
    pub fn new(canvas: Element, image_list: Element) -> Self {
        std::panic::set_hook(Box::new(console_error_panic_hook::hook));
        Self { canvas: Canvas::new(canvas), image_list: ImageList::new(image_list), images: Vec::new(), manifest: None, index: 0 }
    }

    #[wasm_bindgen]
    /// Manifestをセットする
    pub fn set_manifest(&mut self, manifest: String) -> bool {
        let manifest: serde_json::Result<Manifest> = serde_json::from_str(&manifest);
        let manifest = match manifest {
            Ok(m) => m,
            Err(_) => {
                log("Cannot read manifest");
                return false;
            }
        };

        // push images
        let images = manifest.get_images();
        for image in images {
            log(image.src());
            self.push_image(image.src());
        }
        // set image_list
        // todo デバッグ。何か問題がある
        self.image_list.set_manifest(&manifest);
        self.manifest = Some(manifest);
        true
    }

    #[wasm_bindgen]
    /// イメージを表示する
    pub fn show(&mut self, index: usize) -> bool {
        let context = self.context();
        let canvas = self.canvas();
        if let Some(image) = self.images.get_mut(index) {
            if !image.loading() {
                image.load();
                return false;
            }
            if let Some(img) = &image.image {
                log(&format!("show: {}", index));
                self.index = index;
                // prepare to show
                let width = img.width();
                let height = img.height();
                canvas.set_width(width);
                canvas.set_height(height);

                context.draw_image_with_html_image_element(img, image.position_x, image.position_y);
                return true;
            }
            return false;
        }
        return true;
    }

    #[wasm_bindgen]
    /// イメージをsrcから表示する
    pub fn get_index_by_src(&mut self, src: String) -> usize {
        let images = &self.images;
        let mut index = self.index;
        for i in 0..images.len() {
            let image = &images[i].src;
            if image == &src {
                log("found");
                index = i;
                break;
            }
        }
        index
    }

    #[wasm_bindgen]
    /// 次のイメージを表示する
    pub fn next(&mut self) -> bool {
        self.show(self.index + 1)
    }

    #[wasm_bindgen]
    /// 前のイメージを表示する
    pub fn prev(&mut self) -> bool {
        self.show(self.index - 1)
    }

    /// onclickイベント
    #[wasm_bindgen]
    pub fn click(&mut self, event: MouseEvent) -> Direction {
        let offset_width = self.canvas().offset_width();
        let x = event.page_x()
            - self.canvas_elem().get_bounding_client_rect().left() as i32
            - web_sys::window().unwrap().page_x_offset().unwrap_or(0.0) as i32;
        Direction::from(offset_width, x)
    }

    /// mousedownイベント
    #[wasm_bindgen]
    pub fn mousedown(&mut self, event: MouseEvent) {
        log(&format!("event: X{} Y{}", event.offset_x(), event.offset_y()));
        self.canvas.mousedown = Some((event.offset_x() as f64, event.offset_y() as f64));
    }

    /// mousemoveイベント
    #[wasm_bindgen]
    pub fn mousemove(&mut self, event: MouseEvent) {
        if let Some((origin_x, origin_y)) = self.canvas.mousedown.clone() {
            log(&format!("original: X{} Y{}", origin_x, origin_y));
            if let Some(image) = self.images.get_mut(self.index) {
                image.position_x = event.offset_x() as f64 - origin_x + image.original_x;
                image.position_y = event.offset_y() as f64 - origin_y + image.original_y;
                self.show(self.index);
            }
        }
    }

    /// mouseupイベント
    #[wasm_bindgen]
    pub fn mouseup(&mut self, event: MouseEvent) {
        if let Some(original) = &self.canvas.mousedown {
            if let Some(image) = self.images.get_mut(self.index) {
                image.original_x = image.position_x;
                image.original_y = image.position_y;
            }
        }
        self.canvas.mousedown = None;
    }

    /// canvasのelementを取得する
    fn canvas_elem(&self) -> &Element {
        &self.canvas.element
    }

    /// canvasを取得する
    fn canvas(&self) -> HtmlCanvasElement {
        self.canvas_elem().clone()
            .dyn_into::<web_sys::HtmlCanvasElement>()
            .map_err(|_| ())
            .unwrap()
    }

    /// canvasのcontextを取得する
    fn context(&self) -> CanvasRenderingContext2d {
        self.canvas()
            .get_context("2d")
            .unwrap()
            .unwrap()
            .dyn_into::<web_sys::CanvasRenderingContext2d>()
            .unwrap()
    }
}

#[wasm_bindgen]
/// Viewer.imagesに関する実装
impl Viewer {
    /// イメージを追加
    fn push_image(&mut self, src: &str) {
        self.images.push(ViewerImage::new(src));
    }

    #[wasm_bindgen]
    /// HtmlImageElementを取得
    pub fn get_image_elem(&self, index: usize) -> Option<HtmlImageElement> {
        if let Some(image) = self.images.get(index) {
            image.image.clone()
        } else { None }
    }

    #[wasm_bindgen]
    /// imageの数
    pub fn size(&self) -> usize {
        self.images.len()
    }

    #[wasm_bindgen]
    pub fn load(&mut self, index: usize) {
        if let Some(image) = self.images.get_mut(index) {
            if image.loaded() {
                log(&format!("viewer.images[{}] is loaded.", index));
            } else {
                image.load();
            }
        }
    }

    #[wasm_bindgen]
    pub fn is_loading(&self, index: usize) -> bool {
        if let Some(image) = self.images.get(index) {
            image.loading()
        } else {
            log(&format!("viewer.images[{}] is Option::None", index));
            true
        }
    }

    #[wasm_bindgen]
    pub fn is_loaded(&self, index: usize) -> bool {
        if let Some(image) = self.images.get(index) {
            image.loaded()
        } else {
            log(&format!("viewer.images[{}] is Option::None", index));
            true
        }
    }
}

/// 画像を表示する部分
struct Canvas {
    element: Element,
    mousedown: Option<(f64, f64)>,
}

impl Canvas {
    pub fn new(element: Element) -> Self {
        Self { element, mousedown: None }
    }
}

struct ViewerImage {
    pub image: Option<HtmlImageElement>,
    pub src: String,
    pub position_x: f64,
    pub position_y: f64,
    pub original_x: f64,
    pub original_y: f64,
    pub zoom: f64,
}

impl ViewerImage {
    pub fn new(src: &str) -> Self {
        let src = src.to_string();
        Self {
            image: None,
            src,
            position_x: 0.0,
            position_y: 0.0,
            original_x: 0.0,
            original_y: 0.0,
            zoom: 1.0,
        }
    }

    /// 読み込みを試みたか否か
    pub fn loading(&self) -> bool {
        self.image.is_some()
    }

    /// 読み込み済みか否か
    pub fn loaded(&self) -> bool {
        if let Some(image) = &self.image {
            image.complete()
        } else { false }
    }

    /// 読み込む
    pub fn load(&mut self) {
        let image = HtmlImageElement::new().unwrap();
        image.set_src(&self.src);
        self.image = Some(image);
    }
}

struct ImageList {
    element: Element
}

impl ImageList {
    pub fn new(element: Element) -> Self {
//        &element.class_list().add_1("collection");
//        &element.set_attribute("is","image-list");
        Self { element }
    }

    /// manifestから中身をセットする
    pub fn set_manifest(&self, manifest: &Manifest) {
        let elems = manifest.to_image_list();
        for elem in elems {
            self.element.append_child(&Node::from(elem));
        }
    }
}

struct ImageListItem {
    src: String,
    name: String,
}

#[derive(Deserialize, Debug, Serialize, Default)]
struct ImageSrcs {
    pub srcs: Vec<String>,
}

#[wasm_bindgen]
pub enum Direction {
    Left,
    Right,
    None,
}

impl Direction {
    fn from(offset_width: i32, x: i32) -> Self {
        if x < offset_width / 4 {
            Direction::Left
        } else if x > offset_width * 3 / 4 {
            Direction::Right
        } else { Direction::None }
    }
}
