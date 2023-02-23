use hdi::prelude::*;

pub const DEFAULT_MAX_ASSOCIATION_CHARS: usize = 70;
pub const DEFAULT_MAX_REFLECTION_CHARS: usize = 4000;
pub const DEFAULT_MAX_OFFER_CHARS: usize = 300;
pub const DEFAULT_MAX_ANECDOTE_CHARS: usize = 750;


#[derive(Clone, Serialize, Deserialize, Debug, SerializedBytes)]
pub struct CravingDnaProperties {
    pub title: String,
    pub description: String,
    pub max_association_chars: Option<usize>,
    pub max_reflection_chars: Option<usize>,
    pub max_offer_chars: Option<usize>,
    pub max_anecdote_chars: Option<usize>,
}