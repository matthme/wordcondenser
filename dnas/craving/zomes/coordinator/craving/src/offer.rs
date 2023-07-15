use hdk::prelude::*;
use craving_integrity::*;
#[hdk_extern]
pub fn create_offer(offer: Offer) -> ExternResult<Record> {
    let offer_hash = create_entry(&EntryTypes::Offer(offer.clone()))?;
    let record = get(offer_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly created Offer"))
            ),
        )?;
    let path = Path::from("all_offers");
    create_link(path.path_entry_hash()?, offer_hash.clone(), LinkTypes::AllOffers, ())?;
    Ok(record)
}
#[hdk_extern]
pub fn get_offer(original_offer_hash: ActionHash) -> ExternResult<Option<Record>> {
    let links = get_links(original_offer_hash.clone(), LinkTypes::OfferUpdates, None)?;
    let latest_link = links
        .into_iter()
        .max_by(|link_a, link_b| link_b.timestamp.cmp(&link_a.timestamp));
    let latest_offer_hash = match latest_link {
        Some(link) => ActionHash::try_from(link.target.clone()).map_err(|err| wasm_error!(WasmErrorInner::from(err)))?,
        None => original_offer_hash.clone(),
    };
    get(latest_offer_hash, GetOptions::default())
}
#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateOfferInput {
    pub original_offer_hash: ActionHash,
    pub previous_offer_hash: ActionHash,
    pub updated_offer: Offer,
}
#[hdk_extern]
pub fn update_offer(input: UpdateOfferInput) -> ExternResult<Record> {
    let updated_offer_hash = update_entry(
        input.previous_offer_hash.clone(),
        &input.updated_offer,
    )?;
    create_link(
        input.original_offer_hash.clone(),
        updated_offer_hash.clone(),
        LinkTypes::OfferUpdates,
        (),
    )?;
    let record = get(updated_offer_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly updated Offer"))
            ),
        )?;
    Ok(record)
}
#[hdk_extern]
pub fn delete_offer(original_offer_hash: ActionHash) -> ExternResult<ActionHash> {
    delete_entry(original_offer_hash)
}
