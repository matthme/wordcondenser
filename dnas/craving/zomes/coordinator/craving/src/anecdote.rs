use hdk::prelude::*;
use craving_integrity::*;
#[hdk_extern]
pub fn create_anecdote(anecdote: Anecdote) -> ExternResult<Record> {
    let anecdote_hash = create_entry(&EntryTypes::Anecdote(anecdote.clone()))?;
    let record = get(anecdote_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly created Anecdote"))
            ),
        )?;
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
pub fn get_anecdote(original_anecdote_hash: ActionHash) -> ExternResult<Option<Record>> {
    let links = get_links(
        original_anecdote_hash.clone(),
        LinkTypes::AnecdoteUpdates,
        None,
    )?;
    let latest_link = links
        .into_iter()
        .max_by(|link_a, link_b| link_b.timestamp.cmp(&link_a.timestamp));
    let latest_anecdote_hash = match latest_link {
        Some(link) => ActionHash::try_from(link.target.clone()).map_err(|err| wasm_error!(WasmErrorInner::from(err)))?,
        None => original_anecdote_hash.clone(),
    };
    get(latest_anecdote_hash, GetOptions::default())
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
    let record = get(updated_anecdote_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly updated Anecdote"))
            ),
        )?;
    Ok(record)
}
#[hdk_extern]
pub fn delete_anecdote(original_anecdote_hash: ActionHash) -> ExternResult<ActionHash> {
    delete_entry(original_anecdote_hash)
}
