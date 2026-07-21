use craving_integrity::*;
use hdk::prelude::*;

use crate::helper::ZomeFnInput;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CreateAssociationInput {
    pub association: Association,
    pub craving_hash: ActionHash,
}

#[hdk_extern]
pub fn create_association(input: CreateAssociationInput) -> ExternResult<Record> {
    let association_hash = create_entry(&EntryTypes::Association(input.association.clone()))?;
    let record = get(association_hash.clone(), GetOptions::local())?.ok_or(wasm_error!(
        WasmErrorInner::Guest(String::from("Could not find the newly created Association"))
    ))?;
    create_link(
        input.craving_hash,
        association_hash.clone(),
        LinkTypes::AllAssociations,
        (),
    )?;
    Ok(record)
}
#[hdk_extern]
pub fn get_association(entry_hash: ZomeFnInput<EntryHash>) -> ExternResult<Option<Record>> {
    get(entry_hash.input.clone(), entry_hash.get_options())
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
    get(
        latest_association_hash,
        original_association_hash.get_options(),
    )
}
