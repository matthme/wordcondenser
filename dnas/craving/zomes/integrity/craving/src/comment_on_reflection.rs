use hdi::prelude::*;
use crate::types::*;

#[hdk_entry_helper]
#[derive(Clone)]
pub struct CommentOnReflection {
    pub reflection_hash: ActionHash,
    pub comment: String,
}
pub fn validate_create_comment_on_reflection(
    _action: EntryCreationAction,
    comment_on_reflection: CommentOnReflection,
) -> ExternResult<ValidateCallbackResult> {
    let record = must_get_valid_record(comment_on_reflection.reflection_hash.clone())?;
    let _reflection: crate::Reflection = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Dependant action must be accompanied by an entry"))
            ),
        )?;

    // comments on reflections are limited to the same size as a reflection itself
    let dna_info = dna_info()?;
    let craving_dna_properties = CravingDnaProperties::try_from(dna_info.modifiers.properties)
        .map_err(|err| wasm_error!(WasmErrorInner::Guest(format!("Failed to convert dna properties into CravingDnaProperties during validation of offer creation: {}", err.to_string()))))?;


    match craving_dna_properties.max_reflection_chars {
        Some(max) => {
            if comment_on_reflection.comment.len() > max {
                return Ok(ValidateCallbackResult::Invalid(format!("Comment on Reflection is longer than allowed. Max characters: {} (same as Reflection max charachters)", max)));
            }
        },
        None => {
            if comment_on_reflection.comment.len() > DEFAULT_MAX_REFLECTION_CHARS {
                return Ok(ValidateCallbackResult::Invalid(format!("Comment on Reflection is longer than allowed. Max characters: {} (default value)", DEFAULT_MAX_REFLECTION_CHARS)));
            }
        },
    }

    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_update_comment_on_reflection(
    _action: Update,
    _comment_on_reflection: CommentOnReflection,
    _original_action: EntryCreationAction,
    _original_comment_on_reflection: CommentOnReflection,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_comment_on_reflection(
    _action: Delete,
    _original_action: EntryCreationAction,
    _original_comment_on_reflection: CommentOnReflection,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_create_link_reflection_to_comment_on_reflections(
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
    let _comment_on_reflection: crate::CommentOnReflection = record
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
pub fn validate_delete_link_reflection_to_comment_on_reflections(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(
        ValidateCallbackResult::Invalid(
            String::from("ReflectionToCommentOnReflections links cannot be deleted"),
        ),
    )
}
pub fn validate_create_link_comment_on_reflection_updates(
    _action: CreateLink,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let action_hash = ActionHash::try_from(base_address).map_err(|err| wasm_error!(WasmErrorInner::from(err)))?;
    let record = must_get_valid_record(action_hash)?;
    let _comment_on_reflection: crate::CommentOnReflection = record
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
    let _comment_on_reflection: crate::CommentOnReflection = record
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
pub fn validate_delete_link_comment_on_reflection_updates(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(
        ValidateCallbackResult::Invalid(
            String::from("CommentOnReflectionUpdates links cannot be deleted"),
        ),
    )
}
