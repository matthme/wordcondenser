use hdi::prelude::*;

#[hdk_entry_helper]
#[derive(Clone)]
pub struct Craving {
    pub title: String,
    pub description: String,
    pub max_anecdote_chars: Option<usize>,
    pub max_association_chars: Option<usize>,
    pub max_offer_chars: Option<usize>,
    pub max_reflection_chars: Option<usize>,
}
pub fn validate_create_craving(
    _action: EntryCreationAction,
    _craving: Craving,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_update_craving(
    _action: Update,
    _craving: Craving,
    _original_action: EntryCreationAction,
    _original_association: Craving,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from(
        "Cravings cannot be updated",
    )))
}
pub fn validate_delete_craving(
    _action: Delete,
    _original_action: EntryCreationAction,
    _original_association: Craving,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from(
        "Cravings cannot be deleted",
    )))
}
pub fn validate_create_link_all_cravings(
    _action: CreateLink,
    _base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let action_hash = ActionHash::try_from(target_address)
        .map_err(|err| wasm_error!(WasmErrorInner::from(err)))?;
    let record = must_get_valid_record(action_hash)?;
    let _craving: crate::Craving = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
            "Linked action must reference an entry"
        ))))?;
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_all_cravings(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from(
        "AllCravings links cannot be deleted",
    )))
}
