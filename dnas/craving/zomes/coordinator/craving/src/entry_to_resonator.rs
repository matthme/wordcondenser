use hdk::prelude::*;
use craving_integrity::*;
#[hdk_extern]
pub fn add_resonator_for_entry(entry_hash: EntryHash) -> ExternResult<()> {
    let pubkey = agent_info()?.agent_initial_pubkey;
    let existing_links = get_links(
        entry_hash.clone(),
        LinkTypes::EntryToResonator,
        None,
    )?;
    let my_links: Vec<Link> = existing_links
        .into_iter()
        .filter(|link| link.target == pubkey.clone().into())
        .collect();
    if my_links.len() != 0 {
        return Ok(());
    }
    create_link(entry_hash, pubkey, LinkTypes::EntryToResonator, ())?;
    Ok(())
}
#[hdk_extern]
pub fn get_resonators_for_entry(
    entry_hash: EntryHash,
) -> ExternResult<Vec<AgentPubKey>> {
    let links = get_links(entry_hash, LinkTypes::EntryToResonator, None)?;
    let agents: Vec<AgentPubKey> = links
        .into_iter()
        .map(|link| AgentPubKey::from(EntryHash::from(link.target)))
        .collect();
    Ok(agents)
}
#[hdk_extern]
pub fn remove_resonator_for_entry(entry_hash: EntryHash) -> ExternResult<()> {
    let pubkey = agent_info()?.agent_initial_pubkey;
    let existing_links = get_links(entry_hash, LinkTypes::EntryToResonator, None)?;
    let my_links: Vec<Link> = existing_links
        .into_iter()
        .filter(|link| link.target == pubkey.clone().into())
        .collect();
    for link in my_links {
        delete_link(link.create_link_hash)?;
    }
    Ok(())
}
