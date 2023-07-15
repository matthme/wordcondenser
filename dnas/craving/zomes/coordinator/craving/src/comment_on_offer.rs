use hdk::prelude::*;
use craving_integrity::*;
#[hdk_extern]
pub fn create_comment_on_offer(
    comment_on_offer: CommentOnOffer,
) -> ExternResult<Record> {
    let comment_on_offer_hash = create_entry(
        &EntryTypes::CommentOnOffer(comment_on_offer.clone()),
    )?;
    create_link(
        comment_on_offer.offer_hash.clone(),
        comment_on_offer_hash.clone(),
        LinkTypes::OfferToCommentOnOffers,
        (),
    )?;
    let record = get(comment_on_offer_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly created CommentOnOffer"))
            ),
        )?;
    Ok(record)
}
#[hdk_extern]
pub fn get_comment_on_offer(
    original_comment_on_offer_hash: ActionHash,
) -> ExternResult<Option<Record>> {
    let links = get_links(
        original_comment_on_offer_hash.clone(),
        LinkTypes::CommentOnOfferUpdates,
        None,
    )?;
    let latest_link = links
        .into_iter()
        .max_by(|link_a, link_b| link_b.timestamp.cmp(&link_a.timestamp));
    let latest_comment_on_offer_hash = match latest_link {
        Some(link) => ActionHash::try_from(link.target.clone()).map_err(|err| wasm_error!(WasmErrorInner::from(err)))?,
        None => original_comment_on_offer_hash.clone(),
    };
    get(latest_comment_on_offer_hash, GetOptions::default())
}
#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateCommentOnOfferInput {
    pub original_comment_on_offer_hash: ActionHash,
    pub previous_comment_on_offer_hash: ActionHash,
    pub updated_comment_on_offer: CommentOnOffer,
}
#[hdk_extern]
pub fn update_comment_on_offer(
    input: UpdateCommentOnOfferInput,
) -> ExternResult<Record> {
    let updated_comment_on_offer_hash = update_entry(
        input.previous_comment_on_offer_hash.clone(),
        &input.updated_comment_on_offer,
    )?;
    create_link(
        input.original_comment_on_offer_hash.clone(),
        updated_comment_on_offer_hash.clone(),
        LinkTypes::CommentOnOfferUpdates,
        (),
    )?;
    let record = get(updated_comment_on_offer_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly updated CommentOnOffer"))
            ),
        )?;
    Ok(record)
}
#[hdk_extern]
pub fn delete_comment_on_offer(
    original_comment_on_offer_hash: ActionHash,
) -> ExternResult<ActionHash> {
    delete_entry(original_comment_on_offer_hash)
}
#[hdk_extern]
pub fn get_comment_on_offers_for_offer(
    offer_hash: ActionHash,
) -> ExternResult<Vec<Record>> {
    let links = get_links(offer_hash, LinkTypes::OfferToCommentOnOffers, None)?;
    let get_input: Vec<GetInput> = links
        .into_iter()
        .map(|link| GetInput::new(
            link.target.into_any_dht_hash().unwrap(),
            GetOptions::default(),
        ))
        .collect();
    let records: Vec<Record> = HDK
        .with(|hdk| hdk.borrow().get(get_input))?
        .into_iter()
        .filter_map(|r| r)
        .collect();
    Ok(records)
}
