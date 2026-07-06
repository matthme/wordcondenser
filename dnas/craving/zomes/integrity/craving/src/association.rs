use hdi::prelude::*;

#[hdk_entry_helper]
#[derive(Clone)]
pub struct Association {
    pub association: String,
}
pub fn validate_create_association(
    _action: EntryCreationAction,
    _association: Association,
) -> ExternResult<ValidateCallbackResult> {
    // TODO optionally require the action hash of the associated craving as well
    // and then fetch the craving here to ensure it exists and validate that the
    // association is not longer than allowed.
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_update_association(
    _action: Update,
    _association: Association,
    _original_action: EntryCreationAction,
    _original_association: Association,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from(
        "Associations cannot be updated",
    )))
}
pub fn validate_delete_association(
    _action: Delete,
    _original_action: EntryCreationAction,
    _original_association: Association,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from(
        "Associations cannot be deleted",
    )))
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
    Ok(ValidateCallbackResult::Invalid(String::from(
        "AssociationUpdates links cannot be updated",
    )))
}
pub fn validate_delete_link_association_updates(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from(
        "AssociationUpdates links cannot be deleted",
    )))
}
pub fn validate_create_link_all_associations(
    _action: CreateLink,
    _base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let action_hash = ActionHash::try_from(target_address)
        .map_err(|err| wasm_error!(WasmErrorInner::from(err)))?;
    let record = must_get_valid_record(action_hash)?;
    let _association: crate::Association = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
            "Linked action must reference an entry"
        ))))?;
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_all_associations(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from(
        "AllAssociations links cannot be deleted",
    )))
}
