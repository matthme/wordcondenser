use craving_integrity::*;
use hdk::prelude::*;

use crate::helper::ZomeFnInput;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CreateOfferInput {
    pub offer: Offer,
    pub craving_hash: ActionHash,
}

#[hdk_extern]
pub fn create_offer(input: CreateOfferInput) -> ExternResult<Record> {
    let offer_hash = create_entry(&EntryTypes::Offer(input.offer.clone()))?;
    let record = get(offer_hash.clone(), GetOptions::local())?.ok_or(wasm_error!(
        WasmErrorInner::Guest(String::from("Could not find the newly created Offer"))
    ))?;
    create_link(
        input.craving_hash,
        offer_hash.clone(),
        LinkTypes::AllOffers,
        (),
    )?;
    Ok(record)
}
#[hdk_extern]
pub fn get_offer(original_offer_hash: ZomeFnInput<ActionHash>) -> ExternResult<Option<Record>> {
    let links = get_links(
        LinkQuery::try_new(original_offer_hash.input.clone(), LinkTypes::OfferUpdates)?,
        original_offer_hash.get_strategy(),
    )?;
    let latest_link = links
        .into_iter()
        .max_by(|link_a, link_b| link_b.timestamp.cmp(&link_a.timestamp));
    let latest_offer_hash = match latest_link {
        Some(link) => ActionHash::try_from(link.target.clone())
            .map_err(|err| wasm_error!(WasmErrorInner::from(err)))?,
        None => original_offer_hash.input.clone(),
    };
    get(latest_offer_hash, original_offer_hash.get_options())
}
#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateOfferInput {
    pub original_offer_hash: ActionHash,
    pub previous_offer_hash: ActionHash,
    pub updated_offer: Offer,
}
#[hdk_extern]
pub fn update_offer(input: UpdateOfferInput) -> ExternResult<Record> {
    let updated_offer_hash = update_entry(input.previous_offer_hash.clone(), &input.updated_offer)?;
    create_link(
        input.original_offer_hash.clone(),
        updated_offer_hash.clone(),
        LinkTypes::OfferUpdates,
        (),
    )?;
    let record = get(updated_offer_hash.clone(), GetOptions::local())?.ok_or(wasm_error!(
        WasmErrorInner::Guest(String::from("Could not find the newly updated Offer"))
    ))?;
    Ok(record)
}
#[hdk_extern]
pub fn delete_offer(original_offer_hash: ActionHash) -> ExternResult<ActionHash> {
    delete_entry(original_offer_hash)
}
