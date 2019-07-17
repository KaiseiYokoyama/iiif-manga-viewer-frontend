use web_sys::{Element, ElementCreationOptions, Node};

use crate::viewer::ViewerImage;


pub trait View {
    fn new(element: Element) -> Self;
    fn initialize(&self, viewer_images: &Vec<ViewerImage>);
}

pub mod list_view {
    use super::*;

    /// Manifestに含まれる画像のリスト
    pub struct ListView {
        element: Element
    }

    impl View for ListView {
        fn new(element: Element) -> Self {
            Self { element }
        }

        fn initialize(&self, viewer_images: &Vec<ViewerImage>) {
            for image in viewer_images {
                // srcを取得
                let src = &image.src;
                // labelを取得
                let label = &image.label;
                // liをdocumentに追加
                let window = web_sys::window().expect("no global `window` exists");
                let document = window.document().expect("should have a document on window");
                let li = match document.create_element_with_element_creation_options("li", ElementCreationOptions::new().is("image-list-item")) {
                    Ok(e) => e,
                    Err(_) => { continue; }
                };
                // liの詳細設定: srcを設定
                li.set_attribute("src", src);
                // liの詳細設定: inner_htmlを設定
                li.set_inner_html(label);
                // set!
                self.element.append_child(&Node::from(li));
            }
        }
    }
}

pub mod icon_view {
    use super::*;

    /// Manifestに含まれる画像の一覧
    pub struct IconView {
        element: Element,
    }

    impl View for IconView {
        fn new(element: Element) -> Self {
            Self { element }
        }

        fn initialize(&self, viewer_images: &Vec<ViewerImage>) {
            self.element.class_list().add_1("row");

            for image in viewer_images {
                // srcを取得
                let src = &image.src;
                // labelを取得
                let label = &image.label;
                // thumbnailを取得
                match &image.thumbnail {
                    Some(thumbnail) => {
                        let thumbnail = thumbnail.clone();
                        let window = web_sys::window().expect("no global `window` exists");
                        let document = window.document().expect("should have a document on window");
                        let icon_view_item = match document.create_element("icon-view-item") {
                            Ok(e) => e,
                            Err(_) => continue,
                        };
                        // itemの詳細設定: srcを設定
                        icon_view_item.set_attribute("src", src);
                        // itemの詳細設定: labelを設定
                        icon_view_item.set_attribute("label", label);
                        // set! thumbnail
                        icon_view_item.append_child(&Node::from(thumbnail));
                        // set!
                        self.element.append_child(&Node::from(icon_view_item));
                    }
                    None => continue,
                }
            }
        }
    }
}

pub mod search_view {
    use super::*;
    use crate::search::SearchResult;

    /// Manifestの検索結果
    #[wasm_bindgen]
    pub struct SearchView {
        element: Element,
    }

    impl View for SearchView {
        fn new(element: Element) -> Self {
            Self { element }
        }

        /// 何もしない
        fn initialize(&self, viewer_images: &Vec<ViewerImage>) {
//            unimplemented!()
        }
    }

    impl SearchView {
        #[wasm_bindgen]
        pub fn result(&self, string: String) -> Vec<SearchResult> {
            return match serde_json::from_str(&string) {
                Ok(s) => { s }
                Err(_) => { vec![] }
            };
        }
    }
}