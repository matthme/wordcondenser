use hdi::prelude::*;

use crate::types::{CravingDnaProperties, DEFAULT_MAX_OFFER_CHARS};
#[hdk_entry_helper]
#[derive(Clone)]
pub struct Offer {
    pub offer: String,
    pub explanation: Option<String>,
}
pub fn validate_create_offer(
    _action: EntryCreationAction,
    offer: Offer,
) -> ExternResult<ValidateCallbackResult> {
    let dna_info = dna_info()?;
    let craving_dna_properties = CravingDnaProperties::try_from(dna_info.properties)
        .map_err(|err| wasm_error!(WasmErrorInner::Guest(format!("Failed to convert dna properties into CravingDnaProperties during validation of offer creation: {}", err.to_string()))))?;

    match craving_dna_properties.max_offer_chars {
        Some(max) => {
            if offer.offer.len() > max {
                return Ok(ValidateCallbackResult::Invalid(format!("Offer is longer than allowed. Max characters: {}", max)));
            }
        },
        None => {
            if offer.offer.len() > DEFAULT_MAX_OFFER_CHARS {
                return Ok(ValidateCallbackResult::Invalid(format!("Offer is longer than allowed. Max characters: {} (default value)", DEFAULT_MAX_OFFER_CHARS)));
            }
        },
    }
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_update_offer(
    _action: Update,
    _offer: Offer,
    _original_action: EntryCreationAction,
    _original_offer: Offer,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_offer(
    _action: Delete,
    _original_action: EntryCreationAction,
    _original_offer: Offer,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_create_link_offer_updates(
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
    let _offer: crate::Offer = record
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
pub fn validate_delete_link_offer_updates(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(
        ValidateCallbackResult::Invalid(
            String::from("OfferUpdates links cannot be deleted"),
        ),
    )
}
pub fn validate_create_link_all_offers(
    _action: CreateLink,
    _base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let action_hash = ActionHash::try_from(target_address).map_err(|err| wasm_error!(WasmErrorInner::from(err)))?;
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
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_all_offers(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(
        ValidateCallbackResult::Invalid(
            String::from("AllOffers links cannot be deleted"),
        ),
    )
}
