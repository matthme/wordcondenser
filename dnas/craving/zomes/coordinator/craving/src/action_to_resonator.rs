use hdk::prelude::*;
use craving_integrity::*;
#[hdk_extern]
pub fn add_resonator_for_action(action_hash: ActionHash) -> ExternResult<()> {
    let pubkey = agent_info()?.agent_initial_pubkey;
    let existing_links = get_links(
        action_hash.clone(),
        LinkTypes::ActionToResonator,
        None,
    )?;
    let my_links: Vec<Link> = existing_links
        .into_iter()
        .filter(|link| link.target == pubkey.clone().into())
        .collect();
    if my_links.len() != 0 {
        return Ok(());
    }
    create_link(action_hash, pubkey, LinkTypes::ActionToResonator, ())?;
    Ok(())
}
#[hdk_extern]
pub fn get_resonators_for_action(
    action_hash: ActionHash,
) -> ExternResult<Vec<AgentPubKey>> {
    let links = get_links(reflection_hash, LinkTypes::ActionToResonator, None)?;
    let agents: Vec<AgentPubKey> = links
        .into_iter()
        .map(|link| AgentPubKey::from(EntryHash::from(link.target)))
        .collect();
    Ok(agents)
}
#[hdk_extern]
pub fn remove_resonator_for_action(action_hash: ActionHash) -> ExternResult<()> {
    let pubkey = agent_info()?.agent_initial_pubkey;
    let existing_links = get_links(action_hash, LinkTypes::ActionToResonator, None)?;
    let my_links: Vec<Link> = existing_links
        .into_iter()
        .filter(|link| link.target == pubkey.clone().into())
        .collect();
    for link in my_links {
        delete_link(link.create_link_hash)?;
    }
    Ok(())
}
