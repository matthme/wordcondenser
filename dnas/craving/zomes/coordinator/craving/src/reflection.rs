use craving_integrity::*;
use hdk::prelude::*;

use crate::helper::ZomeFnInput;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CreateReflectionInput {
    pub reflection: Reflection,
    pub craving_hash: ActionHash,
}

#[hdk_extern]
pub fn create_reflection(input: CreateReflectionInput) -> ExternResult<Record> {
    let reflection_hash = create_entry(&EntryTypes::Reflection(input.reflection.clone()))?;
    let record = get(reflection_hash.clone(), GetOptions::local())?.ok_or(wasm_error!(
        WasmErrorInner::Guest(String::from("Could not find the newly created Reflection"))
    ))?;
    create_link(
        input.craving_hash,
        reflection_hash.clone(),
        LinkTypes::AllReflections,
        (),
    )?;
    Ok(record)
}
#[hdk_extern]
pub fn get_reflection(
    original_reflection_hash: ZomeFnInput<ActionHash>,
) -> ExternResult<Option<Record>> {
    let links = get_links(
        LinkQuery::try_new(
            original_reflection_hash.input.clone(),
            LinkTypes::ReflectionUpdates,
        )?,
        original_reflection_hash.get_strategy(),
    )?;
    let latest_link = links
        .into_iter()
        .max_by(|link_a, link_b| link_b.timestamp.cmp(&link_a.timestamp));
    let latest_reflection_hash = match latest_link {
        Some(link) => ActionHash::try_from(link.target.clone())
            .map_err(|err| wasm_error!(WasmErrorInner::from(err)))?,
        None => original_reflection_hash.input.clone(),
    };
    get(
        latest_reflection_hash,
        original_reflection_hash.get_options(),
    )
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
    let record = get(updated_reflection_hash.clone(), GetOptions::local())?.ok_or(wasm_error!(
        WasmErrorInner::Guest(String::from("Could not find the newly updated Reflection"))
    ))?;
    Ok(record)
}
#[hdk_extern]
pub fn delete_reflection(original_reflection_hash: ActionHash) -> ExternResult<ActionHash> {
    delete_entry(original_reflection_hash)
}
