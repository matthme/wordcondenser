use hdk::prelude::*;
use craving_integrity::*;
#[hdk_extern]
pub fn create_comment_on_reflection(
    comment_on_reflection: CommentOnReflection,
) -> ExternResult<Record> {
    let comment_on_reflection_hash = create_entry(
        &EntryTypes::CommentOnReflection(comment_on_reflection.clone()),
    )?;
    create_link(
        comment_on_reflection.reflection_hash.clone(),
        comment_on_reflection_hash.clone(),
        LinkTypes::ReflectionToCommentOnReflections,
        (),
    )?;
    let record = get(comment_on_reflection_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly created CommentOnReflection"))
            ),
        )?;
    Ok(record)
}
#[hdk_extern]
pub fn get_comment_on_reflection(
    original_comment_on_reflection_hash: ActionHash,
) -> ExternResult<Option<Record>> {
    let links = get_links(
        original_comment_on_reflection_hash.clone(),
        LinkTypes::CommentOnReflectionUpdates,
        None,
    )?;
    let latest_link = links
        .into_iter()
        .max_by(|link_a, link_b| link_b.timestamp.cmp(&link_a.timestamp));
    let latest_comment_on_reflection_hash = match latest_link {
        Some(link) => ActionHash::from(link.target.clone()),
        None => original_comment_on_reflection_hash.clone(),
    };
    get(latest_comment_on_reflection_hash, GetOptions::default())
}
#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateCommentOnReflectionInput {
    pub original_comment_on_reflection_hash: ActionHash,
    pub previous_comment_on_reflection_hash: ActionHash,
    pub updated_comment_on_reflection: CommentOnReflection,
}
#[hdk_extern]
pub fn update_comment_on_reflection(
    input: UpdateCommentOnReflectionInput,
) -> ExternResult<Record> {
    let updated_comment_on_reflection_hash = update_entry(
        input.previous_comment_on_reflection_hash.clone(),
        &input.updated_comment_on_reflection,
    )?;
    create_link(
        input.original_comment_on_reflection_hash.clone(),
        updated_comment_on_reflection_hash.clone(),
        LinkTypes::CommentOnReflectionUpdates,
        (),
    )?;
    let record = get(updated_comment_on_reflection_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly updated CommentOnReflection"))
            ),
        )?;
    Ok(record)
}
#[hdk_extern]
pub fn delete_comment_on_reflection(
    original_comment_on_reflection_hash: ActionHash,
) -> ExternResult<ActionHash> {
    delete_entry(original_comment_on_reflection_hash)
}
#[hdk_extern]
pub fn get_comment_on_reflections_for_reflection(
    reflection_hash: ActionHash,
) -> ExternResult<Vec<Record>> {
    let links = get_links(
        reflection_hash,
        LinkTypes::ReflectionToCommentOnReflections,
        None,
    )?;
    let get_input: Vec<GetInput> = links
        .into_iter()
        .map(|link| GetInput::new(
            ActionHash::from(link.target).into(),
            GetOptions::default(),
        ))
        .collect();
    let records: Vec<Record> = HDK
        .with(|hdk| hdk.borrow().get(get_input))?
        .into_iter()
        .filter_map(|r| r)
        .collect();
    Ok(records)
}
