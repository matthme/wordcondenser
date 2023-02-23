use hdi::prelude::*;
#[hdk_entry_helper]
#[derive(Clone)]
pub struct LobbyInfo {
    pub description: String,
    pub unenforced_rules: Option<String>,
    pub logo_src: Option<String>,
    pub network_seed: String,
}
#[derive(Clone, Serialize, Deserialize, Debug, SerializedBytes)]
pub struct LobbyDnaProperties {
    pub name: String,
    // pub creator: holo_hash::AgentPubKeyB64,  // In version 0.1.X of the Word Condenser, anyone can update the lobby info. That's to reduce friction of (out-of-band) invitations
}
pub fn validate_create_lobby_info(
    _action: EntryCreationAction,
    _lobby_info: LobbyInfo,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_update_lobby_info(
    _action: Update,
    _lobby_info: LobbyInfo,
    _original_action: EntryCreationAction,
    _original_lobby_info: LobbyInfo,
) -> ExternResult<ValidateCallbackResult> {

    // In version 0.1.X of the Word Condenser, anyone can update the lobby info. That's to reduce friction
    // of (out-of-band) invitations because otherwise the public key of the lobby creator would need to be
    // sent in an invitation as well and known at install time. And opposed to 5 words, a public key can not
    // really ergonomically be typed from another device but needs to be copied on the same device realisically

    // let dna_info = dna_info()?;
    // let lobby_dna_properties = LobbyDnaProperties::try_from(dna_info.properties)
    //     .map_err(|err| wasm_error!(WasmErrorInner::Guest(format!("Failed to convert dna properties into LobbyDnaProperties during validation: {}", err.to_string()))))?;

    // let creator_pubkey: AgentPubKey = lobby_dna_properties.creator.into();
    // if action.author != creator_pubkey {
    //     return Ok(ValidateCallbackResult::Invalid(String::from("Only the creator of a Lobby is allowed to update the Lobby info")));
    // }

    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_lobby_info(
    _action: Delete,
    _original_action: EntryCreationAction,
    _original_lobby_info: LobbyInfo,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from("Lobby Infos cannot be deleted")))
}
pub fn validate_create_link_lobby_info_updates(
    _action: CreateLink,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let action_hash = ActionHash::from(base_address);
    let record = must_get_valid_record(action_hash)?;
    let _lobby_info: crate::LobbyInfo = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Linked action must reference an entry"))
            ),
        )?;
    let action_hash = ActionHash::from(target_address);
    let record = must_get_valid_record(action_hash)?;
    let _lobby_info: crate::LobbyInfo = record
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
pub fn validate_delete_link_lobby_info_updates(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(
        ValidateCallbackResult::Invalid(
            String::from("LobbyInfoUpdates links cannot be deleted"),
        ),
    )
}
