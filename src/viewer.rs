use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

use web_sys::{Element, HtmlImageElement, HtmlCanvasElement, CanvasRenderingContext2d, MouseEvent};

use js_sys::Promise;
use crate::iiif_manifest::Manifest;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
struct Viewer {
    canvas: Canvas,
    //    page_list: Element,
    images: Vec<Image>,
    pub index: usize,
}

#[wasm_bindgen]
impl Viewer {
    #[wasm_bindgen(constructor)]
    /// Viewerのコンストラクタ
    pub fn new(canvas: Element, page_list: Element) -> Self {
        std::panic::set_hook(Box::new(console_error_panic_hook::hook));
        Self { canvas: Canvas::new(canvas), images: Vec::new(), index: 0 }
    }

    #[wasm_bindgen]
    /// Manifestのurlからimageのurl一覧を出力する
    pub fn from_manifest(&mut self, url: String) -> Promise {
        use futures::{future, Future};
        use wasm_bindgen::prelude::*;
        use wasm_bindgen::JsCast;
        use wasm_bindgen_futures::future_to_promise;
        use wasm_bindgen_futures::JsFuture;
        use web_sys::{Request, RequestInit, RequestMode, Response};

        let mut opts = RequestInit::new();
        opts.method("GET");
        opts.mode(RequestMode::Cors);

        let request = Request::new_with_str_and_init(&url, &opts).unwrap();

        let window = web_sys::window().unwrap();
        let request_promise = window.fetch_with_request(&request);

        let future = JsFuture::from(request_promise)
            .and_then(|resp_value| {
                // `resp_value` is a `Response` object.
                assert!(resp_value.is_instance_of::<Response>());
                let resp: Response = resp_value.dyn_into().unwrap();
                resp.json()
            })
            .and_then(|json_value: Promise| {
                // Convert this other `Promise` into a rust `Future`.
                JsFuture::from(json_value)
            })
            .and_then(|json| {
                let mut images = ImageSrcs::default();
                // Use serde to parse the JSON into a struct.
                let manifest: Manifest = json.into_serde().unwrap();
                for image in &manifest.get_images() {
                    images.srcs.push(image.clone());
                }

                future::ok(JsValue::from_serde(&images).unwrap())
            });

        // Convert this Rust `Future` back into a JS `Promise`.
        future_to_promise(future)
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
        }
        return true;
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
    #[wasm_bindgen]
    /// イメージを追加
    pub fn push_image(&mut self, src: String) {
        self.images.push(Image::new(src));
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


struct Image {
    pub image: Option<HtmlImageElement>,
    pub src: String,
    pub position_x: f64,
    pub position_y: f64,
    pub original_x: f64,
    pub original_y: f64,
    pub zoom: f64,
}

impl Image {
    pub fn new(src: String) -> Self {
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
