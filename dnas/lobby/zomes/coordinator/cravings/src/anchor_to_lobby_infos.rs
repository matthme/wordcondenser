use hdk::prelude::*;
use cravings_integrity::*;

#[derive(Serialize, Deserialize, Debug)]
pub struct AddLobbyInfoForAnchorInput {
    anchor: AgentPubKey,
    lobby_info_hash: ActionHash,
}
#[hdk_extern]
pub fn add_lobby_info_for_anchor(input: AddLobbyInfoForAnchorInput) -> ExternResult<()> {
    create_link(input.anchor.clone(), input.lobby_info_hash.clone(), LinkTypes::AnchorToLobbyInfo, ())?;


    Ok(())
}

#[hdk_extern]
pub fn get_lobby_infos_for_anchor(anchor: AgentPubKey) -> ExternResult<Vec<Record>> {
    let links = get_links(anchor, LinkTypes::AnchorToLobbyInfo, None)?;

    let get_input: Vec<GetInput> = links
        .into_iter()
        .map(|link| GetInput::new(ActionHash::from(link.target).into(), GetOptions::default()))
        .collect();

    // Get the records to filter out the deleted ones
    let records: Vec<Record> = HDK.with(|hdk| hdk.borrow().get(get_input))?
        .into_iter()
        .filter_map(|r| r)
        .collect();

    Ok(records)
}


