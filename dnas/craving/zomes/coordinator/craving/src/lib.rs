pub mod all_anecdotes;
pub mod all_reflections;
pub mod all_associations;
pub mod all_offers;
pub mod entry_to_resonator;
pub mod comment_on_reflection;
pub mod comment_on_offer;
pub mod anecdote;
pub mod association;
pub mod reflection;
pub mod offer;
pub mod get_init_time;
use hdk::prelude::*;
use craving_integrity::*;
#[hdk_extern]
pub fn init(_: ()) -> ExternResult<InitCallbackResult> {
    Ok(InitCallbackResult::Pass)
}
#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
pub enum Signal {
    LinkCreated { action: SignedActionHashed, link_type: LinkTypes },
    LinkDeleted { action: SignedActionHashed, link_type: LinkTypes },
    EntryCreated { action: SignedActionHashed, record: Record, app_entry: EntryTypes },
    EntryUpdated {
        action: SignedActionHashed,
        record: Record,
        app_entry: EntryTypes,
        original_record: Record,
        original_app_entry: EntryTypes,
    },
    EntryDeleted { action: SignedActionHashed, original_app_entry: EntryTypes },
}
#[hdk_extern(infallible)]
pub fn post_commit(committed_actions: Vec<SignedActionHashed>) {
    for action in committed_actions {
        if let Err(err) = signal_action(action) {
            error!("Error signaling new action: {:?}", err);
        }
    }
}
fn signal_action(action: SignedActionHashed) -> ExternResult<()> {
    match action.hashed.content.clone() {
        Action::CreateLink(create_link) => {
            let link_type = LinkTypes::from_type(
                    create_link.zome_index,
                    create_link.link_type,
                )?
                .ok_or(
                    wasm_error!(
                        WasmErrorInner::Guest("Link type should be exist".to_string())
                    ),
                )?;
            emit_signal(Signal::LinkCreated {
                action,
                link_type,
            })?;
            Ok(())
        }
        Action::DeleteLink(delete_link) => {
            let record = get(
                    delete_link.link_add_address.clone(),
                    GetOptions::default(),
                )?
                .ok_or(
                    wasm_error!(
                        WasmErrorInner::Guest("Create Link should exist".to_string())
                    ),
                )?;
            match record.action() {
                Action::CreateLink(create_link) => {
                    let link_type = LinkTypes::from_type(
                            create_link.zome_index,
                            create_link.link_type,
                        )?
                        .ok_or(
                            wasm_error!(
                                WasmErrorInner::Guest("Link type should be exist"
                                .to_string())
                            ),
                        )?;
                    emit_signal(Signal::LinkDeleted {
                        action,
                        link_type,
                    })?;
                    Ok(())
                }
                _ => {
                    return Err(
                        wasm_error!(
                            WasmErrorInner::Guest("Create Link should exist".to_string())
                        ),
                    );
                }
            }
        }
        Action::Create(_create) => {
            let (maybe_record, maybe_app_entry) = get_entry_and_record_for_action(&action.hashed.hash)?;

            let (record, app_entry) = match (maybe_record, maybe_app_entry) {
                (Some(record), Some(app_entry)) => (record, app_entry),
                _ => return Err(
                    wasm_error!(
                        WasmErrorInner::Guest("Create should carry an entry".to_string())
                    )
                )
            };

            emit_signal(Signal::EntryCreated {
                action,
                record,
                app_entry,
            })?;
            Ok(())
        }
        Action::Update(update) => {

            let (maybe_record, maybe_app_entry) = get_entry_and_record_for_action(&action.hashed.hash)?;

            let (record, app_entry) = match (maybe_record, maybe_app_entry) {
                (Some(record), Some(app_entry)) => (record, app_entry),
                _ => return Err(
                    wasm_error!(
                        WasmErrorInner::Guest("Update should carry an entry".to_string())
                    )
                )
            };

            let (maybe_original_record, maybe_original_app_entry) = get_entry_and_record_for_action(&update.original_action_address)?;

            let (original_record, original_app_entry) = match (maybe_original_record, maybe_original_app_entry) {
                (Some(record), Some(app_entry)) => (record, app_entry),
                _ => return Err(
                    wasm_error!(
                        WasmErrorInner::Guest("Update should carry an entry".to_string())
                    )
                )
            };

            emit_signal(Signal::EntryUpdated {
                action,
                record,
                app_entry,
                original_record,
                original_app_entry,
            })?;
            Ok(())
        }
        Action::Delete(delete) => {
            let original_app_entry = get_entry_for_action(&delete.deletes_address)?
                .ok_or(
                    wasm_error!(
                        WasmErrorInner::Guest("Deleted action should carry an entry"
                        .to_string())
                    ),
                )?;
            emit_signal(Signal::EntryDeleted {
                action,
                original_app_entry,
            })?;
            Ok(())
        }
        _ => Ok(()),
    }
}
fn get_entry_for_action(action_hash: &ActionHash) -> ExternResult<Option<EntryTypes>> {
    let record = match get_details(action_hash.clone(), GetOptions::default())? {
        Some(Details::Record(record_details)) => record_details.record,
        _ => {
            return Ok(None);
        }
    };
    let entry = match record.entry().as_option() {
        Some(entry) => entry,
        None => {
            return Ok(None);
        }
    };
    let (zome_index, entry_index) = match record.action().entry_type() {
        Some(EntryType::App(AppEntryDef { zome_index, entry_index, .. })) => {
            (zome_index, entry_index)
        }
        _ => {
            return Ok(None);
        }
    };
    Ok(
        EntryTypes::deserialize_from_type(
            zome_index.clone(),
            entry_index.clone(),
            entry,
        )?,
    )
}

fn get_entry_and_record_for_action(action_hash: &ActionHash) -> ExternResult<(Option<Record>, Option<EntryTypes>)> {
    let record = match get_details(action_hash.clone(), GetOptions::default())? {
        Some(Details::Record(record_details)) => record_details.record,
        _ => {
            return Ok((None, None));
        }
    };
    let record_clone = record.clone();
    let entry = match record.entry().as_option() {
        Some(entry) => entry,
        None => {
            return Ok((Some(record), None));
        }
    };
    let (zome_index, entry_index) = match record.action().entry_type() {
        Some(EntryType::App(AppEntryDef { zome_index, entry_index, .. })) => {
            (zome_index, entry_index)
        }
        _ => {
            return Ok((Some(record), None));
        }
    };
    Ok(
        (
            Some(record_clone),
            EntryTypes::deserialize_from_type(
                zome_index.clone(),
                entry_index.clone(),
                entry,
            )?
        ),
    )
}

