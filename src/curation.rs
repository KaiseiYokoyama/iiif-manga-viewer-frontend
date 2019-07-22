use wasm_bindgen::prelude::*;

use crate::viewer::{Position, log};
use std::ops::{Range, RangeInclusive};

use web_sys::{MouseEvent, HtmlImageElement};

#[wasm_bindgen]
#[derive(Serialize, Deserialize)]
pub struct CurationItem {
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
}

#[wasm_bindgen]
impl CurationItem {
    #[wasm_bindgen(constructor)]
    pub fn new(manifest_id: String, image_id: String, label: String, origin: MouseEvent, term: MouseEvent, img: HtmlImageElement) -> Self {
        let zoom = (img.natural_width() / img.width()) as i32;
        let (mut xl, mut xr) =
            if origin.offset_x() < term.offset_x() {
                (origin.offset_x() * zoom, term.offset_x() * zoom)
            } else { (term.offset_x() * zoom, origin.offset_x() * zoom) };
        let (mut yt, mut yb) =
            if origin.offset_y() < term.offset_y() {
                (origin.offset_y() * zoom, term.offset_y() * zoom)
            } else { (term.offset_y() * zoom, origin.offset_y() * zoom) };
        let description = String::new();

        let crop = (xl as u32..=xr as u32, yt as u32..=yb as u32);

        Self { manifest_id, image_id, label, crop, description }
    }

    pub fn manifest_id(&self) -> String {
        self.manifest_id.clone()
    }

    pub fn image_id(&self) -> String {
        self.image_id.clone()
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
}

struct CurationViewer {
    element: Element,
    items: Vec<CurationItem>,
}