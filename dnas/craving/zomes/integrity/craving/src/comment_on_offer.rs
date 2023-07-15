use hdi::prelude::*;
use crate::types::*;

#[hdk_entry_helper]
#[derive(Clone)]
pub struct CommentOnOffer {
    pub offer_hash: ActionHash,
    pub comment: String,
}
pub fn validate_create_comment_on_offer(
    _action: EntryCreationAction,
    comment_on_offer: CommentOnOffer,
) -> ExternResult<ValidateCallbackResult> {
    let record = must_get_valid_record(comment_on_offer.offer_hash.clone())?;
    let _offer: crate::Offer = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Dependant action must be accompanied by an entry"))
            ),
        )?;

    // comments on offers are limited to a fixed max size of 800 characters
    let max_chars: usize = 800;
    if comment_on_offer.comment.len() > max_chars {
        return Ok(ValidateCallbackResult::Invalid(format!("Comment on Offer is longer than allowed. Max characters: {} (hard-coded)", max_chars)));
    }

    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_update_comment_on_offer(
    _action: Update,
    _comment_on_offer: CommentOnOffer,
    _original_action: EntryCreationAction,
    _original_comment_on_offer: CommentOnOffer,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_comment_on_offer(
    _action: Delete,
    _original_action: EntryCreationAction,
    _original_comment_on_offer: CommentOnOffer,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_create_link_offer_to_comment_on_offers(
    _action: CreateLink,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let action_hash = ActionHash::try_from(base_address).map_err(|err| wasm_error!(WasmErrorInner::from(err)))?;
    let record = must_get_valid_record(action_hash)?;
    let _offer: crate::Offer = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Linked action must reference an entry"))
            ),
        )?;
    let action_hash = ActionHash::try_from(target_address).map_err(|err| wasm_error!(WasmErrorInner::from(err)))?;
    let record = must_get_valid_record(action_hash)?;
    let _comment_on_offer: crate::CommentOnOffer = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Linked action must reference an entry"))
            ),
        )?;
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_offer_to_comment_on_offers(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(
        ValidateCallbackResult::Invalid(
            String::from("OfferToCommentOnOffers links cannot be deleted"),
        ),
    )
}
pub fn validate_create_link_comment_on_offer_updates(
    _action: CreateLink,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let action_hash = ActionHash::try_from(base_address).map_err(|err| wasm_error!(WasmErrorInner::from(err)))?;
    let record = must_get_valid_record(action_hash)?;
    let _comment_on_offer: crate::CommentOnOffer = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Linked action must reference an entry"))
            ),
        )?;
    let action_hash = ActionHash::try_from(target_address).map_err(|err| wasm_error!(WasmErrorInner::from(err)))?;
    let record = must_get_valid_record(action_hash)?;
    let _comment_on_offer: crate::CommentOnOffer = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Linked action must reference an entry"))
            ),
        )?;
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_comment_on_offer_updates(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(
        ValidateCallbackResult::Invalid(
            String::from("CommentOnOfferUpdates links cannot be deleted"),
        ),
    )
}
