use craving_integrity::*;
use hdk::prelude::*;

use crate::helper::ZomeFnInput;
#[hdk_extern]
pub fn create_craving(craving: Craving) -> ExternResult<Record> {
    let craving_hash = create_entry(&EntryTypes::Craving(craving.clone()))?;
    let record = get(craving_hash.clone(), GetOptions::default())?.ok_or(wasm_error!(
        WasmErrorInner::Guest(String::from("Could not find the newly created Craving"))
    ))?;
    let path = Path::from("all_cravings");
    create_link(
        path.path_entry_hash()?,
        craving_hash.clone(),
        LinkTypes::AllCravings,
        (),
    )?;
    Ok(record)
}
#[hdk_extern]
pub fn get_craving(craving_hash: ZomeFnInput<ActionHash>) -> ExternResult<Option<Record>> {
    get(craving_hash.input.clone(), craving_hash.get_options())
}
