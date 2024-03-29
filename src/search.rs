use wasm_bindgen::prelude::*;
use std::str::FromStr;

/// サーバーから送られてくる検索結果(1件)
#[wasm_bindgen]
#[derive(Serialize, Deserialize, Clone)]
pub struct SearchResult {
    url: String,
    title: String,
    description: String,
    thumbnail: Option<String>,
}

#[wasm_bindgen]
impl SearchResult {
    #[wasm_bindgen(constructor)]
    pub fn new(url: String, title: String, description: String, thumbnail: Option<String>) -> Self {
        Self { url, title, description, thumbnail }
    }

    pub fn url(&self) -> String {
        self.url.clone()
    }

    pub fn title(&self) -> String {
        self.title.clone()
    }

    pub fn description(&self) -> String {
        self.description.clone()
    }

    pub fn thumbnail(&self) -> Option<String> {
        self.thumbnail.clone()
    }
}

/// サーバーから送られてくる検索結果
#[wasm_bindgen]
pub struct SearchResults {
    results: Vec<SearchResult>
}

#[wasm_bindgen]
impl SearchResults {
    #[wasm_bindgen(constructor)]
    pub fn new(s: String) -> SearchResults {
        match serde_json::from_str(&s) {
            Ok(results) => SearchResults { results },
            Err(_) => SearchResults { results: vec![] },
        }
    }

    pub fn len(&self) -> usize {
        let SearchResults { results: vec } = &self;
        vec.len()
    }

    pub fn get(&self, i: usize) -> Option<SearchResult> {
        let SearchResults { results: vec } = &self;
        vec.get(i).cloned()
    }
}


/// サーバーに投げる検索クエリ
/// [参考](https://pro.europeana.eu/resources/apis/search) ## Getting Started
#[wasm_bindgen]
#[derive(Serialize, Deserialize)]
pub struct SearchQuery {
    query: String,
    theme: String,
    sort: String,
    rows: u8,
}

#[wasm_bindgen]
impl SearchQuery {
    #[wasm_bindgen(constructor)]
    pub fn new(query: String) -> Self {
        Self { query, theme: String::new(), sort: String::new(), rows: 10 }
    }

    pub fn set_theme(&mut self, theme: String) {
        self.theme = theme;
    }

    pub fn set_sort(&mut self, sort: String) {
        self.sort = sort;
    }

    pub fn set_rows(&mut self, rows: u32) {
        let rows = if rows > u8::max_value() as u32 {
            u8::max_value()
        } else { rows as u8 };
        self.rows = rows;
    }

    pub fn query(&self) -> String {
        self.query.clone()
    }

    pub fn theme(&self) -> String {
        self.theme.clone()
    }

    pub fn sort(&self) -> String {
        self.sort.clone()
    }

    pub fn rows(&self) -> u8 {
        self.rows.clone()
    }

    pub fn json(&self) -> String {
        serde_json::to_string(&self).unwrap_or(String::new())
    }
}

