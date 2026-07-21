use craving_integrity::*;
use hdk::prelude::*;

use crate::helper::ZomeFnInput;
#[hdk_extern]
pub fn get_reflections_for_craving(input: ZomeFnInput<ActionHash>) -> ExternResult<Vec<Record>> {
    let links = get_links(
        LinkQuery::try_new(input.input.clone(), LinkTypes::AllReflections)?,
        input.get_strategy(),
    )?;

    let get_input: Vec<GetInput> = links
        .into_iter()
        .map(|link| {
            GetInput::new(
                link.target.into_any_dht_hash().unwrap(),
                input.get_options(),
            )
        })
        .collect();
    let records = HDK.with(|hdk| hdk.borrow().get(get_input))?;
    let records: Vec<Record> = records.into_iter().filter_map(|r| r).collect();
    Ok(records)
}
