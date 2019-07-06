use std::str::FromStr;

#[derive(Deserialize, Debug, Serialize)]
pub struct Manifest {
    #[serde(rename = "@context")]
    context: String,
    #[serde(rename = "@id")]
    id: String,
    #[serde(rename = "@type")]
    type_: String,
    license: Option<String>,
    attribution: Option<String>,
    description: Option<String>,
    label: String,
    sequences: Vec<Sequence>,
}

impl Manifest {
    pub fn get_images(&self) -> Vec<String> {
        let mut images = Vec::new();

        for sequence in &self.sequences {
            for canvas in &sequence.canvases {
                for image in &canvas.images {
                    images.push(image.resource.id.clone());
                }
            }
        }

        return images;
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
    id: String,
    #[serde(rename = "@type")]
    type_: String,
    canvases: Vec<Canvas>,
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

#[derive(Deserialize, Debug, Serialize)]
struct Image {
    #[serde(rename = "@id")]
    id: String,
    #[serde(rename = "@type")]
    type_: String,
    resource: Resource,
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