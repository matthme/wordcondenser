use craving_integrity::*;
use hdk::prelude::*;

use crate::helper::ZomeFnInput;
#[hdk_extern]
pub fn create_anecdote(anecdote: Anecdote) -> ExternResult<Record> {
    let anecdote_hash = create_entry(&EntryTypes::Anecdote(anecdote.clone()))?;
    let record = get(anecdote_hash.clone(), GetOptions::local())?.ok_or(wasm_error!(
        WasmErrorInner::Guest(String::from("Could not find the newly created Anecdote"))
    ))?;
    let path = Path::from("all_anecdotes");
    create_link(
        path.path_entry_hash()?,
        anecdote_hash.clone(),
        LinkTypes::AllAnecdotes,
        (),
    )?;
    Ok(record)
}
#[hdk_extern]
pub fn get_anecdote(
    original_anecdote_hash: ZomeFnInput<ActionHash>,
) -> ExternResult<Option<Record>> {
    let links = get_links(
        LinkQuery::try_new(
            original_anecdote_hash.input.clone(),
            LinkTypes::AnecdoteUpdates,
        )?,
        original_anecdote_hash.get_strategy(),
    )?;

    let latest_link = links
        .into_iter()
        .max_by(|link_a, link_b| link_b.timestamp.cmp(&link_a.timestamp));
    let latest_anecdote_hash = match latest_link {
        Some(link) => ActionHash::try_from(link.target.clone())
            .map_err(|err| wasm_error!(WasmErrorInner::from(err)))?,
        None => original_anecdote_hash.input.clone(),
    };
    get(latest_anecdote_hash, original_anecdote_hash.get_options())
}
#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateAnecdoteInput {
    pub original_anecdote_hash: ActionHash,
    pub previous_anecdote_hash: ActionHash,
    pub updated_anecdote: Anecdote,
}
#[hdk_extern]
pub fn update_anecdote(input: UpdateAnecdoteInput) -> ExternResult<Record> {
    let updated_anecdote_hash = update_entry(
        input.previous_anecdote_hash.clone(),
        &input.updated_anecdote,
    )?;
    create_link(
        input.original_anecdote_hash.clone(),
        updated_anecdote_hash.clone(),
        LinkTypes::AnecdoteUpdates,
        (),
    )?;
    let record = get(updated_anecdote_hash.clone(), GetOptions::local())?.ok_or(wasm_error!(
        WasmErrorInner::Guest(String::from("Could not find the newly updated Anecdote"))
    ))?;
    Ok(record)
}
#[hdk_extern]
pub fn delete_anecdote(original_anecdote_hash: ActionHash) -> ExternResult<ActionHash> {
    delete_entry(original_anecdote_hash)
}
