use hdi::prelude::*;
use crate::types::*;

#[hdk_entry_helper]
#[derive(Clone)]
pub struct Reflection {
    pub title: String,
    pub reflection: String,
}
pub fn validate_create_reflection(
    _action: EntryCreationAction,
    reflection: Reflection,
) -> ExternResult<ValidateCallbackResult> {
    let dna_info = dna_info()?;
    let craving_dna_properties = CravingDnaProperties::try_from(dna_info.modifiers.properties)
        .map_err(|err| wasm_error!(WasmErrorInner::Guest(format!("Failed to convert dna properties into CravingDnaProperties during validation of reflection creation: {}", err.to_string()))))?;

    match craving_dna_properties.max_reflection_chars {
        Some(max) => {
            if reflection.reflection.len() > max {
                return Ok(ValidateCallbackResult::Invalid(format!("Reflection is longer than allowed. Max characters: {}", max)));
            }
        },
        None => {
            if reflection.reflection.len() > DEFAULT_MAX_REFLECTION_CHARS {
                return Ok(ValidateCallbackResult::Invalid(format!("Reflection is longer than allowed. Max characters: {} (default value)", DEFAULT_MAX_REFLECTION_CHARS)));
            }
        },
    }

    // max title length is hardcoded at 80 chars
    if reflection.title.len() > 80 {
        return Ok(ValidateCallbackResult::Invalid(format!("Reflection title is longer than allowed. Max characters: 80")));
    }

    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_update_reflection(
    _action: Update,
    _reflection: Reflection,
    _original_action: EntryCreationAction,
    _original_reflection: Reflection,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_reflection(
    _action: Delete,
    _original_action: EntryCreationAction,
    _original_reflection: Reflection,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_create_link_reflection_updates(
    _action: CreateLink,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let action_hash = ActionHash::try_from(base_address).map_err(|err| wasm_error!(WasmErrorInner::from(err)))?;
    let record = must_get_valid_record(action_hash)?;
    let _reflection: crate::Reflection = record
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
    let _reflection: crate::Reflection = record
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
pub fn validate_delete_link_reflection_updates(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(
        ValidateCallbackResult::Invalid(
            String::from("ReflectionUpdates links cannot be deleted"),
        ),
    )
}
pub fn validate_create_link_all_reflections(
    _action: CreateLink,
    _base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let action_hash = ActionHash::try_from(target_address).map_err(|err| wasm_error!(WasmErrorInner::from(err)))?;
    let record = must_get_valid_record(action_hash)?;
    let _reflection: crate::Reflection = record
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
pub fn validate_delete_link_all_reflections(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(
        ValidateCallbackResult::Invalid(
            String::from("AllReflections links cannot be deleted"),
        ),
    )
}
