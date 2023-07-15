use hdi::prelude::*;
pub fn validate_create_link_entry_to_resonator(
    action: CreateLink,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let target_pubkey = AgentPubKey::try_from(target_address).map_err(|err| wasm_error!(WasmErrorInner::from(err)))?;
    // debug!("#### Validating EntryToResonator link. Target pubkey: {:?}", target_pubkey);
    let author_pubkey = action.author;
    // debug!("#### Validating EntryToResonator link. author_pubkey: {:?}", author_pubkey);
    // debug!("#### Validating EntryToResonator link. target_pubkey == author_pubkey: {:?}", target_pubkey == author_pubkey);

    if target_pubkey != author_pubkey {
        return Ok(
            ValidateCallbackResult::Invalid(
                String::from(
                    "Resonators can only be created for oneself. Author public key of the CreateLink does not match the link's target.",
                ),
            ),
        );
    }
    let entry_hash = EntryHash::try_from(base_address).map_err(|err| wasm_error!(WasmErrorInner::from(err)))?;
    let _entry = must_get_entry(entry_hash)?.content;
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_entry_to_resonator(
    action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let target_pubkey = AgentPubKey::try_from(target).map_err(|err| wasm_error!(WasmErrorInner::from(err)))?;
    // debug!("#### Validating DeleteEntryToResonator link. Target pubkey: {:?}", target_pubkey);
    let author_pubkey = action.author;
    // debug!("#### Validating DeleteEntryToResonator link. author_pubkey: {:?}", author_pubkey);
    // debug!("#### Validating DeleteEntryToResonator link. target_pubkey == author_pubkey: {:?}", target_pubkey == author_pubkey);
    if target_pubkey != author_pubkey {
        return Ok(
            ValidateCallbackResult::Invalid(
                String::from(
                    "Resonators can only be created for oneself. Author public key of the CreateLink does not match the link's target.",
                ),
            ),
        );
    }
    Ok(ValidateCallbackResult::Valid)
}
