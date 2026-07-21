use crate::helper::ZomeFnInput;
use craving_integrity::*;
use hdk::prelude::*;

#[hdk_extern]
pub fn add_resonator_for_action(action_hash: ZomeFnInput<ActionHash>) -> ExternResult<()> {
    let pubkey = agent_info()?.agent_initial_pubkey;
    let existing_links = get_links(
        LinkQuery::try_new(action_hash.input.clone(), LinkTypes::ActionToResonator)?,
        action_hash.get_strategy(),
    )?;
    let my_links: Vec<Link> = existing_links
        .into_iter()
        .filter(|link| link.target == pubkey.clone().into())
        .collect();
    if my_links.len() != 0 {
        return Ok(());
    }
    create_link(action_hash.input, pubkey, LinkTypes::ActionToResonator, ())?;
    Ok(())
}
#[hdk_extern]
pub fn get_resonators_for_action(
    action_hash: ZomeFnInput<ActionHash>,
) -> ExternResult<Vec<AgentPubKey>> {
    let links = get_links(
        LinkQuery::try_new(action_hash.input.clone(), LinkTypes::ActionToResonator)?,
        action_hash.get_strategy(),
    )?;
    let agents: Vec<AgentPubKey> = links
        .into_iter()
        .map(|link| AgentPubKey::try_from(link.target).ok())
        .filter_map(|ak| ak)
        .collect();
    Ok(agents)
}
#[hdk_extern]
pub fn remove_resonator_for_action(action_hash: ZomeFnInput<ActionHash>) -> ExternResult<()> {
    let pubkey = agent_info()?.agent_initial_pubkey;
    let existing_links = get_links(
        LinkQuery::try_new(action_hash.input.clone(), LinkTypes::ActionToResonator)?,
        action_hash.get_strategy(),
    )?;
    let my_links: Vec<Link> = existing_links
        .into_iter()
        .filter(|link| link.target == pubkey.clone().into())
        .collect();
    for link in my_links {
        delete_link(link.create_link_hash, action_hash.get_options())?;
    }
    Ok(())
}
