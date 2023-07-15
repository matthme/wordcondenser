use hdk::prelude::*;
use cravings_integrity::*;

const LOBBY_INFO: &str = "LOBBY_INFO";

#[hdk_extern]
pub fn create_lobby_info(lobby_info: LobbyInfo) -> ExternResult<Record> {
    let anchor = anchor(LinkTypes::AnchorToLobbyInfo, LOBBY_INFO.into(), LOBBY_INFO.into())?;
    let existing_links = get_links(anchor.clone(), LinkTypes::AnchorToLobbyInfo, None)?;
    if existing_links.len() != 0 {
        return Err(
            wasm_error!(
                WasmErrorInner::Guest(String::from("There is already a link from the LOBBY_INFO anchor. Only one link is allowed."))
            ),
        );
    }
    let lobby_info_hash = create_entry(&EntryTypes::LobbyInfo(lobby_info.clone()))?;

    create_link(anchor, lobby_info_hash.clone(), LinkTypes::AnchorToLobbyInfo, ())?;
    let record = get(lobby_info_hash, GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly created Craving."))
            ),
        )?;

    Ok(record)
}
#[hdk_extern]
pub fn get_lobby_info(
    _: (),
) -> ExternResult<Option<Record>> {
    let anchor = anchor(LinkTypes::AnchorToLobbyInfo, LOBBY_INFO.into(), LOBBY_INFO.into())?;
    let anchor_links = get_links(anchor.clone(), LinkTypes::AnchorToLobbyInfo, None)?;
    if anchor_links.len() == 0 {
        return Err(
            wasm_error!(
                WasmErrorInner::Guest(String::from("There is no link pointing to the lobby info yet."))
            ),
        );
    }

    let original_lobby_info_hash = ActionHash::try_from(
        anchor_links.first().unwrap().target.clone(),
    ).map_err(|err| wasm_error!(WasmErrorInner::from(err)))?;

    let links = get_links(
        original_lobby_info_hash.clone(),
        LinkTypes::LobbyInfoUpdates,
        None,
    )?;
    let latest_link = links
        .into_iter()
        .max_by(|link_a, link_b| link_b.timestamp.cmp(&link_a.timestamp));
    let latest_lobby_info_hash = match latest_link {
        Some(link) => ActionHash::try_from(link.target.clone()).map_err(|err| wasm_error!(WasmErrorInner::from(err)))?,
        None => original_lobby_info_hash.clone(),
    };
    get(latest_lobby_info_hash, GetOptions::default())
}
#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateLobbyInfoInput {
    pub original_lobby_info_hash: ActionHash,
    pub previous_lobby_info_hash: ActionHash,
    pub updated_lobby_info: LobbyInfo,
}
#[hdk_extern]
pub fn update_lobby_info(input: UpdateLobbyInfoInput) -> ExternResult<Record> {

    // In version 0.1.X of the Word Condenser, anyone can update the lobby info. That's to reduce friction of (out-of-band) invitations

    // let dna_info = dna_info()?;
    // let lobby_dna_properties = LobbyDnaProperties::try_from(dna_info.properties)
    //     .map_err(|err| wasm_error!(WasmErrorInner::Guest(format!("Failed to convert dna properties into LobbyDnaProperties: {}", err.to_string()))))?;

    // let creator_pubkey: AgentPubKey = lobby_dna_properties.creator.into();
    // let my_pubkey = agent_info()?.agent_initial_pubkey;

    // if creator_pubkey != my_pubkey {
    //     return Err(wasm_error!(WasmErrorInner::Guest(String::from("Only the creator of a Lobby is allowed to update the LobbyInfo."))));
    // }

    let updated_lobby_info_hash = update_entry(
        input.previous_lobby_info_hash.clone(),
        &input.updated_lobby_info,
    )?;
    create_link(
        input.original_lobby_info_hash.clone(),
        updated_lobby_info_hash.clone(),
        LinkTypes::LobbyInfoUpdates,
        (),
    )?;
    let record = get(updated_lobby_info_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly updated LobbyInfo"))
            ),
        )?;
    Ok(record)
}



// Gets the lobby name which is written to the properties upon lobby creation.
#[hdk_extern]
pub fn get_lobby_name(_: ()) -> ExternResult<String> {
    let dna_info = dna_info()?;
    let properties = LobbyDnaProperties::try_from(dna_info.properties)
        .map_err(|err| wasm_error!(WasmErrorInner::Guest(format!("Failed to read lobby dna properties from dna info: {}", err.to_string()))))?;
    Ok(properties.name)
}

