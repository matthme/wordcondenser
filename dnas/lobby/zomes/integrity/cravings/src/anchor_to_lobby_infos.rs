use hdi::prelude::*;
pub fn validate_create_link_anchor_to_lobby_infos(
    _action: CreateLink,
    _base_address: AnyLinkableHash,
    _target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    // Check the entry type for the given action hash
    // let action_hash = ActionHash::from(target_address);
    // let record = must_get_valid_record(action_hash)?;
    // let _lobby_info: crate::LobbyInfo = record
    //     .entry()
    //     .to_app_option()
    //     .map_err(|e| wasm_error!(e))?
    //     .ok_or(
    //         wasm_error!(
    //             WasmErrorInner::Guest(String::from("Linked action must reference an entry"))
    //         ),
    //     )?;
    // TODO: add the appropriate validation rules
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_anchor_to_lobby_infos(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(
        ValidateCallbackResult::Invalid(
            String::from("AnchorToLobbyInfo links cannot be deleted"),
        ),
    )
}
