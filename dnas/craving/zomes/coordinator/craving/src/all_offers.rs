use hdk::prelude::*;
use craving_integrity::*;



/// Getting all deduplicated associations.
#[hdk_extern]
pub fn get_all_offers(_: ()) -> ExternResult<Vec<Record>> {
    let path = Path::from("all_offers");
    let links = get_links(path.path_entry_hash()?, LinkTypes::AllOffers, None)?;
    let get_input: Vec<GetInput> = links
        .into_iter()
        .map(|link| GetInput::new(
            ActionHash::from(link.target).into(),
            GetOptions::default(),
        ))
        .collect();
    let records = HDK.with(|hdk| hdk.borrow().get(get_input))?;

    // offers should not be duplicated if multiple agents create the same offers independently.
    // This function therefore returns deduplicated Records
    let entry_hashes_deduped: HashSet<EntryHash> = records
        .into_iter()
        .filter_map(|r| r) // filter out None's
        .map(|r| r.action().clone())
        .map(|action| action.entry_hash().cloned())
        .filter_map(|maybe_eh| maybe_eh)
        .map(|eh| eh.clone())
        .collect();


    // TODO! Make this nicer than calling get again just to get the deduped records.
    // But records are probably cached anyway at this point so it may not be too costly
    let get_input: Vec<GetInput> = entry_hashes_deduped
    .into_iter()
    .map(|entry_hash| GetInput::new(
        entry_hash.into(),
        GetOptions::default(),
    ))
    .collect();

    let records_deduped = HDK.with(|hdk| hdk.borrow().get(get_input))?;
    let records_deduped: Vec<Record> = records_deduped.into_iter().filter_map(|r| r).collect();

    Ok(records_deduped)
}



#[hdk_extern]
pub fn get_all_offer_actions(_: ()) -> ExternResult<Vec<Record>> {
    let path = Path::from("all_offers");
    let links = get_links(path.path_entry_hash()?, LinkTypes::AllOffers, None)?;
    let get_input: Vec<GetInput> = links
        .into_iter()
        .map(|link| GetInput::new(
            ActionHash::from(link.target).into(),
            GetOptions::default(),
        ))
        .collect();
    let records = HDK.with(|hdk| hdk.borrow().get(get_input))?;
    let records: Vec<Record> = records.into_iter().filter_map(|r| r).collect();
    Ok(records)
}
