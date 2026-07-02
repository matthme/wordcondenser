use craving_integrity::*;
use hdk::prelude::*;

use crate::helper::ZomeFnInput;
#[hdk_extern]
pub fn add_resonator_for_entry(entry_hash: ZomeFnInput<EntryHash>) -> ExternResult<()> {
    let pubkey = agent_info()?.agent_initial_pubkey;
    let existing_links = get_links(
        LinkQuery::try_new(entry_hash.input.clone(), LinkTypes::EntryToResonator)?,
        entry_hash.get_strategy(),
    )?;

    let my_links: Vec<Link> = existing_links
        .into_iter()
        .filter(|link| link.target == pubkey.clone().into())
        .collect();
    if my_links.len() != 0 {
        return Ok(());
    }
    create_link(entry_hash.input, pubkey, LinkTypes::EntryToResonator, ())?;
    Ok(())
}
#[hdk_extern]
pub fn get_resonators_for_entry(
    entry_hash: ZomeFnInput<EntryHash>,
) -> ExternResult<Vec<AgentPubKey>> {
    let links = get_links(
        LinkQuery::try_new(entry_hash.input.clone(), LinkTypes::EntryToResonator)?,
        entry_hash.get_strategy(),
    )?;
    let agents: Vec<AgentPubKey> = links
        .into_iter()
        .map(|link| link.target.into_agent_pub_key().unwrap())
        .collect();
    Ok(agents)
}
#[hdk_extern]
pub fn remove_resonator_for_entry(entry_hash: ZomeFnInput<EntryHash>) -> ExternResult<()> {
    let pubkey = agent_info()?.agent_initial_pubkey;
    let existing_links = get_links(
        LinkQuery::try_new(entry_hash.input.clone(), LinkTypes::EntryToResonator)?,
        entry_hash.get_strategy(),
    )?;
    let my_links: Vec<Link> = existing_links
        .into_iter()
        .filter(|link| link.target == pubkey.clone().into())
        .collect();
    for link in my_links {
        delete_link(link.create_link_hash, entry_hash.get_options())?;
    }
    Ok(())
}
