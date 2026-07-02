use craving_integrity::*;
use hdk::prelude::*;

use crate::helper::ZomeFnInput;
#[hdk_extern]
pub fn get_all_reflections(input: ZomeFnInput<()>) -> ExternResult<Vec<Record>> {
    let path = Path::from("all_reflections");
    let links = get_links(
        LinkQuery::try_new(path.path_entry_hash()?, LinkTypes::AllReflections)?,
        input.get_strategy(),
    )?;

    let get_input: Vec<GetInput> = links
        .into_iter()
        .map(|link| {
            GetInput::new(
                link.target.into_any_dht_hash().unwrap(),
                GetOptions::default(),
            )
        })
        .collect();
    let records = HDK.with(|hdk| hdk.borrow().get(get_input))?;
    let records: Vec<Record> = records.into_iter().filter_map(|r| r).collect();
    Ok(records)
}
