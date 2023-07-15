use hdi::prelude::*;

use crate::types::{CravingDnaProperties, DEFAULT_MAX_ANECDOTE_CHARS};
#[hdk_entry_helper]
#[derive(Clone)]
pub struct Anecdote {
    pub anecdote: String,
}
pub fn validate_create_anecdote(
    _action: EntryCreationAction,
    anecdote: Anecdote,
) -> ExternResult<ValidateCallbackResult> {
    let dna_info = dna_info()?;
    let craving_dna_properties = CravingDnaProperties::try_from(dna_info.modifiers.properties)
        .map_err(|err| wasm_error!(WasmErrorInner::Guest(format!("Failed to convert dna properties into CravingDnaProperties during validation of anecdote creation: {}", err.to_string()))))?;

    match craving_dna_properties.max_anecdote_chars {
        Some(max) => {
            if anecdote.anecdote.len() > max {
                return Ok(ValidateCallbackResult::Invalid(format!("Anecdote is longer than allowed. Max characters: {}", max)));
            }
        },
        None => {
            if anecdote.anecdote.len() > DEFAULT_MAX_ANECDOTE_CHARS {
                return Ok(ValidateCallbackResult::Invalid(format!("Anecdote is longer than allowed. Max characters: {} (default value)", DEFAULT_MAX_ANECDOTE_CHARS)));
            }
        },
    }
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_update_anecdote(
    _action: Update,
    _anecdote: Anecdote,
    _original_action: EntryCreationAction,
    _original_anecdote: Anecdote,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_anecdote(
    _action: Delete,
    _original_action: EntryCreationAction,
    _original_anecdote: Anecdote,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_create_link_anecdote_updates(
    _action: CreateLink,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let action_hash = ActionHash::try_from(base_address).map_err(|err| wasm_error!(WasmErrorInner::from(err)))?;
    let record = must_get_valid_record(action_hash)?;
    let _anecdote: crate::Anecdote = record
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
    let _anecdote: crate::Anecdote = record
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
pub fn validate_delete_link_anecdote_updates(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(
        ValidateCallbackResult::Invalid(
            String::from("AnecdoteUpdates links cannot be deleted"),
        ),
    )
}
pub fn validate_create_link_all_anecdotes(
    _action: CreateLink,
    _base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    // Check the entry type for the given action hash
    let action_hash = ActionHash::try_from(target_address).map_err(|err| wasm_error!(WasmErrorInner::from(err)))?;
    let record = must_get_valid_record(action_hash)?;
    let _anecdote: crate::Anecdote = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Linked action must reference an entry"))
            ),
        )?;
    // TODO: add the appropriate validation rules
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_all_anecdotes(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(
        ValidateCallbackResult::Invalid(
            String::from("AllAnecdotes links cannot be deleted"),
        ),
    )
}
