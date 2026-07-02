use craving_integrity::*;
use hdk::prelude::*;

use crate::helper::ZomeFnInput;
#[hdk_extern]
pub fn create_association(association: Association) -> ExternResult<Record> {
    let association_hash = create_entry(&EntryTypes::Association(association.clone()))?;
    let record = get(association_hash.clone(), GetOptions::default())?.ok_or(wasm_error!(
        WasmErrorInner::Guest(String::from("Could not find the newly created Association"))
    ))?;
    let path = Path::from("all_associations");
    create_link(
        path.path_entry_hash()?,
        association_hash.clone(),
        LinkTypes::AllAssociations,
        (),
    )?;
    Ok(record)
}
#[hdk_extern]
pub fn get_association(entry_hash: EntryHash) -> ExternResult<Option<Record>> {
    get(entry_hash, GetOptions::default())
}

#[hdk_extern]
pub fn get_association_by_action_hash(
    original_association_hash: ZomeFnInput<ActionHash>,
) -> ExternResult<Option<Record>> {
    let links = get_links(
        LinkQuery::try_new(
            original_association_hash.input.clone(),
            LinkTypes::AssociationUpdates,
        )?,
        original_association_hash.get_strategy(),
    )?;

    let latest_link = links
        .into_iter()
        .max_by(|link_a, link_b| link_b.timestamp.cmp(&link_a.timestamp));
    let latest_association_hash = match latest_link {
        Some(link) => ActionHash::try_from(link.target.clone())
            .map_err(|err| wasm_error!(WasmErrorInner::from(err)))?,
        None => original_association_hash.input.clone(),
    };
    get(latest_association_hash, GetOptions::default())
}
