use std::collections::HashMap;

use hdk::prelude::*;
use craving_integrity::*;


/// Getting all deduplicated associations.
#[hdk_extern]
pub fn get_all_associations(_: ()) -> ExternResult<Vec<Record>> {
    let path = Path::from("all_associations");
    let links = get_links(path.path_entry_hash()?, LinkTypes::AllAssociations, None)?;
    let get_input: Vec<GetInput> = links
        .into_iter()
        .map(|link| GetInput::new(
            link.target.into_any_dht_hash().unwrap(),
            GetOptions::default(),
        ))
        .collect();
    let records = HDK.with(|hdk| hdk.borrow().get(get_input))?;

    // Those records need to be deduplicated, i.e. if there are multiple records with the same EntryHash,
    // only the one with the earliest timestamp should be returned. If two persons independently add the
    // same association it should only be shown once and time-wise what matters is when it was added for the
    // first time.
    let mut sorted_and_deduped_records: HashMap<EntryHash, Record> = HashMap::new();

    for r in records {
        if let Some(record) = r {
            let maybe_entry_hash = record.action().entry_hash();
            if let Some(eh) = maybe_entry_hash {
                let maybe_duplicate_record = sorted_and_deduped_records.get(eh);
                match maybe_duplicate_record {
                    Some(duplicate_record) => {
                        // keep the one with the oldest/earliest timestamp
                        match record.action().timestamp() > duplicate_record.action().timestamp() {
                            true => (),
                            false => {
                                sorted_and_deduped_records.insert(eh.clone(), record);
                            }
                        }
                    },
                    None => {
                        sorted_and_deduped_records.insert(eh.clone(), record);
                    }
                }
            }
        }
    }

    let records_deduped = sorted_and_deduped_records.into_values().collect();

    Ok(records_deduped)
}

/// Get all association records, i.e. if the same association has been created multiple
/// times, return all of them
#[hdk_extern]
pub fn get_all_association_actions(_: ()) -> ExternResult<Vec<Record>> {
    let path = Path::from("all_associations");
    let links = get_links(path.path_entry_hash()?, LinkTypes::AllAssociations, None)?;
    let get_input: Vec<GetInput> = links
        .into_iter()
        .map(|link| GetInput::new(
            link.target.into_any_dht_hash().unwrap(),
            GetOptions::default(),
        ))
        .collect();
    let records = HDK.with(|hdk| hdk.borrow().get(get_input))?;
    let records: Vec<Record> = records.into_iter().filter_map(|r| r).collect();
    Ok(records)
}


