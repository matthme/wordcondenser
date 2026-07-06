use craving_integrity::*;
use hdk::prelude::*;

use crate::helper::ZomeFnInput;
#[hdk_extern]
pub fn get_all_cravings(input: ZomeFnInput<()>) -> ExternResult<Vec<Record>> {
    let path = Path::from("all_cravings");
    let links = get_links(
        LinkQuery::try_new(path.path_entry_hash()?, LinkTypes::AllCravings)?,
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
