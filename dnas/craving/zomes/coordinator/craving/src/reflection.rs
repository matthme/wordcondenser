use hdk::prelude::*;
use craving_integrity::*;
#[hdk_extern]
pub fn create_reflection(reflection: Reflection) -> ExternResult<Record> {
    let reflection_hash = create_entry(&EntryTypes::Reflection(reflection.clone()))?;
    let record = get(reflection_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly created Reflection"))
            ),
        )?;
    let path = Path::from("all_reflections");
    create_link(
        path.path_entry_hash()?,
        reflection_hash.clone(),
        LinkTypes::AllReflections,
        (),
    )?;
    Ok(record)
}
#[hdk_extern]
pub fn get_reflection(
    original_reflection_hash: ActionHash,
) -> ExternResult<Option<Record>> {
    let links = get_links(
        original_reflection_hash.clone(),
        LinkTypes::ReflectionUpdates,
        None,
    )?;
    let latest_link = links
        .into_iter()
        .max_by(|link_a, link_b| link_b.timestamp.cmp(&link_a.timestamp));
    let latest_reflection_hash = match latest_link {
        Some(link) => ActionHash::from(link.target.clone()),
        None => original_reflection_hash.clone(),
    };
    get(latest_reflection_hash, GetOptions::default())
}
#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateReflectionInput {
    pub original_reflection_hash: ActionHash,
    pub previous_reflection_hash: ActionHash,
    pub updated_reflection: Reflection,
}
#[hdk_extern]
pub fn update_reflection(input: UpdateReflectionInput) -> ExternResult<Record> {
    let updated_reflection_hash = update_entry(
        input.previous_reflection_hash.clone(),
        &input.updated_reflection,
    )?;
    create_link(
        input.original_reflection_hash.clone(),
        updated_reflection_hash.clone(),
        LinkTypes::ReflectionUpdates,
        (),
    )?;
    let record = get(updated_reflection_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly updated Reflection"))
            ),
        )?;
    Ok(record)
}
#[hdk_extern]
pub fn delete_reflection(
    original_reflection_hash: ActionHash,
) -> ExternResult<ActionHash> {
    delete_entry(original_reflection_hash)
}
