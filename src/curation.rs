use wasm_bindgen::prelude::*;

use crate::viewer::{Position, log, Canvas};
use std::ops::{Range, RangeInclusive};

use web_sys::{MouseEvent, HtmlImageElement, HtmlCanvasElement, CanvasRenderingContext2d, Element, Node};

#[wasm_bindgen]
#[derive(Serialize, Deserialize, Clone)]
pub struct CurationItem {
    #[serde(skip)]
    image: Option<HtmlImageElement>,
    /// imageを含むManifestのid
    manifest_id: String,
    /// imageのid(取得先)
    image_id: String,
    /// label
    label: String,
    /// 切り取り
    crop: (RangeInclusive<u32>, RangeInclusive<u32>),
    /// 説明
    description: String,
    #[serde(skip)]
    pub position_x: f64,
    #[serde(skip)]
    pub position_y: f64,
    #[serde(skip)]
    pub original_x: f64,
    #[serde(skip)]
    pub original_y: f64,
    #[serde(skip)]
    pub zoom: f64,
}

impl PartialEq for CurationItem {
    fn eq(&self, other: &Self) -> bool {
        self.manifest_id == other.manifest_id
            && self.image_id == other.image_id
            && self.label == other.label
            && self.crop == other.crop
            && self.description == other.description
            && self.position_x == other.position_x
            && self.position_y == other.position_y
            && self.original_x == other.original_x
            && self.original_y == other.original_y
            && self.zoom == other.zoom
    }
}

#[wasm_bindgen]
impl CurationItem {
    #[wasm_bindgen(constructor)]
    pub fn new(manifest_id: String, image_id: String, label: String, origin: MouseEvent, term: MouseEvent, img: HtmlImageElement) -> Self {
        let zoom = img.natural_width() as f64 / img.width() as f64;
        let (mut xl, mut xr) =
            if origin.offset_x() < term.offset_x() {
                (origin.offset_x() as f64 * zoom, term.offset_x() as f64 * zoom)
            } else { (term.offset_x() as f64 * zoom, origin.offset_x() as f64 * zoom) };
        let (mut yt, mut yb) =
            if origin.offset_y() < term.offset_y() {
                (origin.offset_y() as f64 * zoom, term.offset_y() as f64 * zoom)
            } else { (term.offset_y() as f64 * zoom, origin.offset_y() as f64 * zoom) };
        let description = String::new();

        let crop = (xl as u32..=xr as u32, yt as u32..=yb as u32);

        Self {
            image: None,
            manifest_id,
            image_id,
            label,
            crop,
            description,
            position_x: 0.0,
            position_y: 0.0,
            original_x: 0.0,
            original_y: 0.0,
            zoom: 1.0,
        }
    }

    pub fn manifest_id(&self) -> String {
        self.manifest_id.clone()
    }

    pub fn image_id(&self) -> String {
        self.image_id.clone()
    }

    pub fn label(&self) -> String {
        self.label.clone()
    }

    pub fn get_x_start(&self) -> u32 {
        self.crop.0.start().clone()
    }

    pub fn get_x_end(&self) -> u32 {
        self.crop.0.end().clone()
    }

    pub fn get_y_start(&self) -> u32 {
        self.crop.1.start().clone()
    }

    pub fn get_y_end(&self) -> u32 {
        self.crop.1.end().clone()
    }

    pub fn description(&self) -> String {
        self.description.clone()
    }

    pub fn set_description(&mut self, description: String) {
        self.description = description;
    }

    pub fn json(&self) -> Option<String> {
        serde_json::to_string(&self).ok()
    }

    pub fn set_image(&mut self, image: HtmlImageElement) {
        self.image = Some(image);
    }
}

#[wasm_bindgen]
pub struct WasmCurationViewer {
    canvas: Canvas,
    items: Vec<CurationItem>,
    pub index: usize,
}

#[wasm_bindgen]
impl WasmCurationViewer {
    #[wasm_bindgen(constructor)]
    pub fn new(element: Element) -> Self {
        Self {
            canvas: Canvas::new(element),
            items: Vec::new(),
            index: 0,
        }
    }

    pub fn label(&self) -> String {
        "Curation".to_string()
    }

    pub fn image_label(&self) -> String {
        if let Some(img) = self.items.get(self.index) {
            img.label.clone()
        } else {
            String::new()
        }
    }

    pub fn now(&self) -> Option<CurationItem> {
        self.items.get(self.index).cloned()
    }

    pub fn push(&mut self, item: &CurationItem) {
        self.items.push(item.clone());
    }

    pub fn remove(&mut self, index: usize) {
        self.items.remove(index);
    }

    #[wasm_bindgen]
    /// イメージを表示する
    pub fn show(&mut self, item: &CurationItem) -> usize {
        let mut index = self.index;
        for i in 0..self.items.len() {
            if let Some(itm) = self.items.get(i) {
                if itm == item {
                    index = i;
                }
            }
        }
        if let Some(image) = self.items.get(index) {
            if let Some(img) = &image.image {
                self.index = index;
                self.canvas.element.append_child(&Node::from(Element::from(img.clone())));
            }
        }
        index
    }

    #[wasm_bindgen]
    /// イメージを表示する
    pub fn show_by_index(&mut self, index: usize) {
        if let Some(image) = self.items.get(index) {
            if let Some(img) = &image.image {
                self.index = index;
                self.canvas.element.append_child(&Node::from(Element::from(img.clone())));
            }
        }
    }

    #[wasm_bindgen]
    /// イメージをsrcから表示する
    pub fn get_index_by_src(&mut self, src: String) -> usize {
        let items = &self.items;
        let mut index = self.index;

        for i in 0..items.len() {
            let image = &items[i].image_id;
            if image == &src {
                index = i;
                break;
            }
        }
        index
    }

    #[wasm_bindgen]
    /// 次のイメージを表示する
    pub fn next(&mut self) {
        self.show_by_index(self.index + 1)
    }

    #[wasm_bindgen]
    /// 前のイメージを表示する
    pub fn prev(&mut self) {
        self.show_by_index(self.index - 1)
    }

    /// 最後のイメージを表示する
    pub fn show_last(&mut self) {
        let index = self.items.len();
        self.show_by_index(index - 1);
    }

    /// mousedownイベント
    #[wasm_bindgen]
    pub fn move_mousedown(&mut self, event: MouseEvent) {
        self.canvas.mousedown = Some((event.client_x() as f64, event.client_y() as f64));
    }

    /// mousemoveイベント
    #[wasm_bindgen]
    pub fn move_mousemove(&mut self, event: MouseEvent) -> Option<Position> {
        if let Some((origin_x, origin_y)) = self.canvas.mousedown.clone() {
            if let Some(item) = self.items.get_mut(self.index) {
                item.position_x = event.client_x() as f64 - origin_x + item.original_x;
                item.position_y = event.client_y() as f64 - origin_y + item.original_y;
                return Some(Position { x: item.position_x, y: item.position_y });
            }
        }
        None
    }

    /// mouseupイベント
    #[wasm_bindgen]
    pub fn move_mouseup(&mut self) {
        if let Some(original) = &self.canvas.mousedown {
            if let Some(item) = self.items.get_mut(self.index) {
                item.original_x = item.position_x;
                item.original_y = item.position_y;
            }
        }
        self.canvas.mousedown = None;
    }
}