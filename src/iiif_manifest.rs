use std::str::FromStr;

use crate::viewer::log;
use wasm_bindgen::prelude::*;
use web_sys::{Element, HtmlLiElement, ElementCreationOptions};

pub trait ManifestSubstructure {
    fn to_image_list(&self) -> Vec<Element>;
}

#[derive(Deserialize, Debug, Serialize)]
pub struct Manifest {
    #[serde(rename = "@context")]
    context: String,
    #[serde(rename = "@id")]
    id: String,
    #[serde(rename = "@type")]
    type_: String,
    label: String,
    license: Option<String>,
    attribution: Option<String>,
    description: Option<String>,
    sequences: Vec<Sequence>,
}

impl Manifest {
    pub fn get_images(&self) -> Vec<&Image> {
        let mut images = Vec::new();

        for sequence in &self.sequences {
            for canvas in &sequence.canvases {
                for image in &canvas.images {
                    images.push(image);
                }
            }
        }

        return images;
    }

    pub fn to_image_list(&self) -> Vec<Element> {
        let mut elems = Vec::new();
        self.sequences.iter().for_each(|can| elems.append(&mut can.to_image_list()));
        elems
    }
}

impl FromStr for Manifest {
    type Err = serde_json::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        serde_json::from_str(s)
    }
}

#[derive(Deserialize, Debug, Serialize)]
struct Sequence {
    #[serde(rename = "@id")]
    id: Option<String>,
    #[serde(rename = "@type")]
    type_: String,
    canvases: Vec<Canvas>,
}

impl ManifestSubstructure for Sequence {
    fn to_image_list(&self) -> Vec<Element> {
        let mut elems = Vec::new();
        self.canvases.iter().for_each(|can| elems.append(&mut can.to_image_list()));
        elems
    }
}

#[derive(Deserialize, Debug, Serialize)]
struct Canvas {
    #[serde(rename = "@id")]
    id: String,
    #[serde(rename = "@type")]
    type_: String,
    width: u32,
    height: u32,
    label: String,
    images: Vec<Image>,
}

impl ManifestSubstructure for Canvas {
    fn to_image_list(&self) -> Vec<Element> {
        let mut elems = Vec::new();
        let label = &self.label;
        for image in &self.images {
            // srcを取得
            let src = &image.resource.id.clone();
            // liをdocumentに追加
            let window = web_sys::window().expect("no global `window` exists");
            let document = window.document().expect("should have a document on window");
            let li = match document.create_element_with_element_creation_options("li", ElementCreationOptions::new().is("image-list-item")) {
                Ok(e) => e,
                Err(_) => { continue; }
            };
            // liの詳細設定: srcを設定
            li.set_attribute("src", &src);
            // liの詳細設定: CustomElementを設定
//            li.set_attribute("is", "image-list-item");
            // liの詳細設定: inner_htmlを設定
            li.set_inner_html(label);
            // push!
            elems.push(li);
        }
        elems
    }
}

#[derive(Deserialize, Debug, Serialize)]
pub struct Image {
    #[serde(rename = "@id")]
    id: Option<String>,
    #[serde(rename = "@type")]
    type_: String,
    resource: Resource,
}

impl Image {
    pub fn src(&self) -> &String {
        &self.resource.id
    }
}

#[derive(Deserialize, Debug, Serialize)]
struct Resource {
    #[serde(rename = "@id")]
    id: String,
    #[serde(rename = "@type")]
    type_: String,
    format: String,
    width: u32,
    height: u32,
    service: Service,
}

#[derive(Deserialize, Debug, Serialize)]
struct Service {
    #[serde(rename = "@context")]
    context: String,
    #[serde(rename = "@id")]
    id: String,
    profile: String,
}