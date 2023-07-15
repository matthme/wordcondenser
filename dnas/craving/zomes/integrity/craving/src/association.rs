use hdi::prelude::*;
use crate::types::*;

#[hdk_entry_helper]
#[derive(Clone)]
pub struct Association {
    pub association: String,
}
pub fn validate_create_association(
    _action: EntryCreationAction,
    association: Association,
) -> ExternResult<ValidateCallbackResult> {
    let dna_info = dna_info()?;
    let craving_dna_properties = CravingDnaProperties::try_from(dna_info.properties)
        .map_err(|err| wasm_error!(WasmErrorInner::Guest(format!("Failed to convert dna properties into CravingDnaProperties during validation of association creation: {}", err.to_string()))))?;

    match craving_dna_properties.max_association_chars {
        Some(max) => {
            if association.association.len() > max {
                return Ok(ValidateCallbackResult::Invalid(format!("Association is longer than allowed. Max characters: {}", max)));
            }
        },
        None => {
            if association.association.len() > DEFAULT_MAX_ASSOCIATION_CHARS {
                return Ok(ValidateCallbackResult::Invalid(format!("Association is longer than allowed. Max characters: {} (default value)", DEFAULT_MAX_ASSOCIATION_CHARS)));
            }
        },
    }

    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_update_association(
    _action: Update,
    _association: Association,
    _original_action: EntryCreationAction,
    _original_association: Association,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from("Associations cannot be updated")))
}
pub fn validate_delete_association(
    _action: Delete,
    _original_action: EntryCreationAction,
    _original_association: Association,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from("Associations cannot be deleted")))
}
pub fn validate_create_link_association_updates(
    _action: CreateLink,
    _base_address: AnyLinkableHash,
    _target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    // let action_hash = ActionHash::from(base_address);
    // let record = must_get_valid_record(action_hash)?;
    // let _association: crate::Association = record
    //     .entry()
    //     .to_app_option()
    //     .map_err(|e| wasm_error!(e))?
    //     .ok_or(
    //         wasm_error!(
    //             WasmErrorInner::Guest(String::from("Linked action must reference an entry"))
    //         ),
    //     )?;
    // let action_hash = ActionHash::from(target_address);
    // let record = must_get_valid_record(action_hash)?;
    // let _association: crate::Association = record
    //     .entry()
    //     .to_app_option()
    //     .map_err(|e| wasm_error!(e))?
    //     .ok_or(
    //         wasm_error!(
    //             WasmErrorInner::Guest(String::from("Linked action must reference an entry"))
    //         ),
    //     )?;
    // Ok(ValidateCallbackResult::Valid)
    Ok(
        ValidateCallbackResult::Invalid(
            String::from("AssociationUpdates links cannot be updated"),
        ),
    )
}
pub fn validate_delete_link_association_updates(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(
        ValidateCallbackResult::Invalid(
            String::from("AssociationUpdates links cannot be deleted"),
        ),
    )
}
pub fn validate_create_link_all_associations(
    _action: CreateLink,
    _base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let action_hash = ActionHash::try_from(target_address).map_err(|err| wasm_error!(WasmErrorInner::from(err)))?;
    let record = must_get_valid_record(action_hash)?;
    let _association: crate::Association = record
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
pub fn validate_delete_link_all_associations(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(
        ValidateCallbackResult::Invalid(
            String::from("AllAssociations links cannot be deleted"),
        ),
    )
}
