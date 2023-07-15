use hdi::prelude::*;
pub fn validate_create_link_action_to_resonator(
    action: CreateLink,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let target_pubkey = AgentPubKey::try_from(target_address).map_err(|err| wasm_error!(WasmErrorInner::from(err)))?;
    let author_pubkey = action.author;
    if target_pubkey != author_pubkey {
        return Ok(
            ValidateCallbackResult::Invalid(
                String::from(
                    "Resonators can only be created for oneself. Author public key of the CreateLink does not match the link's target.",
                ),
            ),
        );
    }
    let action_hash = ActionHash::try_from(base_address).map_err(|err| wasm_error!(WasmErrorInner::from(err)))?;
    let record = must_get_valid_record(action_hash)?;
    let _reflection = record
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
pub fn validate_delete_link_action_to_resonator(
    action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let target_pubkey = AgentPubKey::try_from(target).map_err(|err| wasm_error!(WasmErrorInner::from(err)))?;
    let author_pubkey = action.author;
    if target_pubkey != author_pubkey {
        return Ok(
            ValidateCallbackResult::Invalid(
                String::from(
                    "Only own resonators can be deleted. Author public key of the DeleteLink does not match the link's target.",
                ),
            ),
        );
    }
    Ok(ValidateCallbackResult::Valid)
}
