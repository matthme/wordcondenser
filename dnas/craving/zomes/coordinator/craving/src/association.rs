use hdk::prelude::*;
use craving_integrity::*;
#[hdk_extern]
pub fn create_association(association: Association) -> ExternResult<Record> {
    let association_hash = create_entry(&EntryTypes::Association(association.clone()))?;
    let record = get(association_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly created Association"))
            ),
        )?;
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
pub fn get_association(
    entry_hash: EntryHash,
) -> ExternResult<Option<Record>> {
    get(entry_hash, GetOptions::default())
}

#[hdk_extern]
pub fn get_association_by_action_hash(
    original_association_hash: ActionHash,
) -> ExternResult<Option<Record>> {
    let links = get_links(
        original_association_hash.clone(),
        LinkTypes::AssociationUpdates,
        None,
    )?;
    let latest_link = links
        .into_iter()
        .max_by(|link_a, link_b| link_b.timestamp.cmp(&link_a.timestamp));
    let latest_association_hash = match latest_link {
        Some(link) => ActionHash::try_from(link.target.clone()).map_err(|err| wasm_error!(WasmErrorInner::from(err)))?,
        None => original_association_hash.clone(),
    };
    get(latest_association_hash, GetOptions::default())
}

// Associations can neither be updated nor deleted.
// #[derive(Serialize, Deserialize, Debug)]
// pub struct UpdateAssociationInput {
//     pub original_association_hash: ActionHash,
//     pub previous_association_hash: ActionHash,
//     pub updated_association: Association,
// }
// #[hdk_extern]
// pub fn update_association(input: UpdateAssociationInput) -> ExternResult<Record> {
//     let updated_association_hash = update_entry(
//         input.previous_association_hash.clone(),
//         &input.updated_association,
//     )?;
//     create_link(
//         input.original_association_hash.clone(),
//         updated_association_hash.clone(),
//         LinkTypes::AssociationUpdates,
//         (),
//     )?;
//     let record = get(updated_association_hash.clone(), GetOptions::default())?
//         .ok_or(
//             wasm_error!(
//                 WasmErrorInner::Guest(String::from("Could not find the newly updated Association"))
//             ),
//         )?;
//     Ok(record)
// }
// #[hdk_extern]
// pub fn delete_association(
//     original_association_hash: ActionHash,
// ) -> ExternResult<ActionHash> {
//     delete_entry(original_association_hash)
// }
