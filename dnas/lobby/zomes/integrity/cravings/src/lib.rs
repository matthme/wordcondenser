pub mod anchor_to_lobby_infos;
pub use anchor_to_lobby_infos::*;
pub mod lobby_info;
pub use lobby_info::*;
pub mod dna_recipe;
pub use dna_recipe::*;
use hdi::prelude::*;
#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
#[hdk_entry_defs]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    DnaRecipe(DnaRecipe),
    LobbyInfo(LobbyInfo),
}
#[derive(Serialize, Deserialize)]
#[hdk_link_types]
pub enum LinkTypes {
    AllCravingRecipes,
    LobbyInfoUpdates,
    AnchorToLobbyInfo,
}
#[hdk_extern]
pub fn genesis_self_check(
    _data: GenesisSelfCheckData,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_agent_joining(
    _agent_pub_key: AgentPubKey,
    _membrane_proof: &Option<MembraneProof>,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
#[hdk_extern]
pub fn validate(op: Op) -> ExternResult<ValidateCallbackResult> {
    match op.to_type::<EntryTypes, LinkTypes>()? {
        OpType::StoreEntry(store_entry) => {
            match store_entry {
                OpEntry::CreateEntry { app_entry, action } => {
                    match app_entry {
                        EntryTypes::DnaRecipe(dna_recipe) => {
                            validate_create_dna_recipe(
                                EntryCreationAction::Create(action),
                                dna_recipe,
                            )
                        }
                        EntryTypes::LobbyInfo(lobby_info) => {
                            validate_create_lobby_info(
                                EntryCreationAction::Create(action),
                                lobby_info,
                            )
                        }
                    }
                }
                OpEntry::UpdateEntry { app_entry, action, .. } => {
                    match app_entry {
                        EntryTypes::DnaRecipe(dna_recipe) => {
                            validate_create_dna_recipe(
                                EntryCreationAction::Update(action),
                                dna_recipe,
                            )
                        }
                        EntryTypes::LobbyInfo(lobby_info) => {
                            validate_create_lobby_info(
                                EntryCreationAction::Update(action),
                                lobby_info,
                            )
                        }
                    }
                }
                _ => Ok(ValidateCallbackResult::Valid),
            }
        }
        OpType::RegisterUpdate(update_entry) => {
            match update_entry {
                OpUpdate::Entry {
                    original_action,
                    original_app_entry,
                    app_entry,
                    action,
                } => {
                    match (app_entry, original_app_entry) {
                        (
                            EntryTypes::LobbyInfo(lobby_info),
                            EntryTypes::LobbyInfo(original_lobby_info),
                        ) => {
                            validate_update_lobby_info(
                                action,
                                lobby_info,
                                original_action,
                                original_lobby_info,
                            )
                        }
                        (
                            EntryTypes::DnaRecipe(dna_recipe),
                            EntryTypes::DnaRecipe(original_dna_recipe),
                        ) => {
                            validate_update_dna_recipe(
                                action,
                                dna_recipe,
                                original_action,
                                original_dna_recipe,
                            )
                        }
                        _ => {
                            Ok(
                                ValidateCallbackResult::Invalid(
                                    "Original and updated entry types must be the same"
                                        .to_string(),
                                ),
                            )
                        }
                    }
                }
                _ => Ok(ValidateCallbackResult::Valid),
            }
        }
        OpType::RegisterDelete(delete_entry) => {
            match delete_entry {
                OpDelete::Entry { original_action, original_app_entry, action } => {
                    match original_app_entry {
                        EntryTypes::DnaRecipe(dna_recipe) => {
                            validate_delete_dna_recipe(
                                action,
                                original_action,
                                dna_recipe,
                            )
                        }
                        EntryTypes::LobbyInfo(lobby_info) => {
                            validate_delete_lobby_info(
                                action,
                                original_action,
                                lobby_info,
                            )
                        }
                    }
                }
                _ => Ok(ValidateCallbackResult::Valid),
            }
        }
        OpType::RegisterCreateLink {
            link_type,
            base_address,
            target_address,
            tag,
            action,
        } => {
            match link_type {
                LinkTypes::AllCravingRecipes => {
                    validate_create_link_all_craving_recipes(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::LobbyInfoUpdates => {
                    validate_create_link_lobby_info_updates(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::AnchorToLobbyInfo => {
                    validate_create_link_anchor_to_lobby_infos(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
            }
        }
        OpType::RegisterDeleteLink {
            link_type,
            base_address,
            target_address,
            tag,
            original_action,
            action,
        } => {
            match link_type {
                LinkTypes::AllCravingRecipes => {
                    validate_delete_link_all_craving_recipes(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::LobbyInfoUpdates => {
                    validate_delete_link_lobby_info_updates(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::AnchorToLobbyInfo => {
                    validate_delete_link_anchor_to_lobby_infos(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
            }
        }
        OpType::StoreRecord(store_record) => {
            match store_record {
                OpRecord::CreateEntry { app_entry, action } => {
                    match app_entry {
                        EntryTypes::DnaRecipe(dna_recipe) => {
                            validate_create_dna_recipe(
                                EntryCreationAction::Create(action),
                                dna_recipe,
                            )
                        }
                        EntryTypes::LobbyInfo(lobby_info) => {
                            validate_create_lobby_info(
                                EntryCreationAction::Create(action),
                                lobby_info,
                            )
                        }
                    }
                }
                OpRecord::UpdateEntry {
                    original_action_hash,
                    app_entry,
                    action,
                    ..
                } => {
                    let original_record = must_get_valid_record(original_action_hash)?;
                    let original_action = original_record.action().clone();
                    let original_action = match original_action {
                        Action::Create(create) => EntryCreationAction::Create(create),
                        Action::Update(update) => EntryCreationAction::Update(update),
                        _ => {
                            return Ok(
                                ValidateCallbackResult::Invalid(
                                    "Original action for an update must be a Create or Update action"
                                        .to_string(),
                                ),
                            );
                        }
                    };
                    match app_entry {
                        EntryTypes::DnaRecipe(dna_recipe) => {
                            let result = validate_create_dna_recipe(
                                EntryCreationAction::Update(action.clone()),
                                dna_recipe.clone(),
                            )?;
                            if let ValidateCallbackResult::Valid = result {
                                let original_dna_recipe: Option<DnaRecipe> = original_record
                                    .entry()
                                    .to_app_option()
                                    .map_err(|e| wasm_error!(e))?;
                                let original_dna_recipe = match original_dna_recipe {
                                    Some(dna_recipe) => dna_recipe,
                                    None => {
                                        return Ok(
                                            ValidateCallbackResult::Invalid(
                                                "The updated entry type must be the same as the original entry type"
                                                    .to_string(),
                                            ),
                                        );
                                    }
                                };
                                validate_update_dna_recipe(
                                    action,
                                    dna_recipe,
                                    original_action,
                                    original_dna_recipe,
                                )
                            } else {
                                Ok(result)
                            }
                        }
                        EntryTypes::LobbyInfo(lobby_info) => {
                            let result = validate_create_lobby_info(
                                EntryCreationAction::Update(action.clone()),
                                lobby_info.clone(),
                            )?;
                            if let ValidateCallbackResult::Valid = result {
                                let original_lobby_info: Option<LobbyInfo> = original_record
                                    .entry()
                                    .to_app_option()
                                    .map_err(|e| wasm_error!(e))?;
                                let original_lobby_info = match original_lobby_info {
                                    Some(lobby_info) => lobby_info,
                                    None => {
                                        return Ok(
                                            ValidateCallbackResult::Invalid(
                                                "The updated entry type must be the same as the original entry type"
                                                    .to_string(),
                                            ),
                                        );
                                    }
                                };
                                validate_update_lobby_info(
                                    action,
                                    lobby_info,
                                    original_action,
                                    original_lobby_info,
                                )
                            } else {
                                Ok(result)
                            }
                        }
                    }
                }
                OpRecord::DeleteEntry { original_action_hash, action, .. } => {
                    let original_record = must_get_valid_record(original_action_hash)?;
                    let original_action = original_record.action().clone();
                    let original_action = match original_action {
                        Action::Create(create) => EntryCreationAction::Create(create),
                        Action::Update(update) => EntryCreationAction::Update(update),
                        _ => {
                            return Ok(
                                ValidateCallbackResult::Invalid(
                                    "Original action for a delete must be a Create or Update action"
                                        .to_string(),
                                ),
                            );
                        }
                    };
                    let app_entry_type = match original_action.entry_type() {
                        EntryType::App(app_entry_type) => app_entry_type,
                        _ => {
                            return Ok(ValidateCallbackResult::Valid);
                        }
                    };
                    let entry = match original_record.entry().as_option() {
                        Some(entry) => entry,
                        None => {
                            if original_action.entry_type().visibility().is_public() {
                                return Ok(
                                    ValidateCallbackResult::Invalid(
                                        "Original record for a delete of a public entry must contain an entry"
                                            .to_string(),
                                    ),
                                );
                            } else {
                                return Ok(ValidateCallbackResult::Valid);
                            }
                        }
                    };
                    let original_app_entry = match EntryTypes::deserialize_from_type(
                        app_entry_type.zome_index.clone(),
                        app_entry_type.entry_index.clone(),
                        &entry,
                    )? {
                        Some(app_entry) => app_entry,
                        None => {
                            return Ok(
                                ValidateCallbackResult::Invalid(
                                    "Original app entry must be one of the defined entry types for this zome"
                                        .to_string(),
                                ),
                            );
                        }
                    };
                    match original_app_entry {
                        EntryTypes::DnaRecipe(original_dna_recipe) => {
                            validate_delete_dna_recipe(
                                action,
                                original_action,
                                original_dna_recipe,
                            )
                        }
                        EntryTypes::LobbyInfo(original_lobby_info) => {
                            validate_delete_lobby_info(
                                action,
                                original_action,
                                original_lobby_info,
                            )
                        }
                    }
                }
                OpRecord::CreateLink {
                    base_address,
                    target_address,
                    tag,
                    link_type,
                    action,
                } => {
                    match link_type {
                        LinkTypes::AllCravingRecipes => {
                            validate_create_link_all_craving_recipes(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                        LinkTypes::LobbyInfoUpdates => {
                            validate_create_link_lobby_info_updates(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                        LinkTypes::AnchorToLobbyInfo => {
                            validate_create_link_anchor_to_lobby_infos(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                    }
                }
                OpRecord::DeleteLink { original_action_hash, base_address, action } => {
                    let record = must_get_valid_record(original_action_hash)?;
                    let create_link = match record.action() {
                        Action::CreateLink(create_link) => create_link.clone(),
                        _ => {
                            return Ok(
                                ValidateCallbackResult::Invalid(
                                    "The action that a DeleteLink deletes must be a CreateLink"
                                        .to_string(),
                                ),
                            );
                        }
                    };
                    let link_type = match LinkTypes::from_type(
                        create_link.zome_index.clone(),
                        create_link.link_type.clone(),
                    )? {
                        Some(lt) => lt,
                        None => {
                            return Ok(ValidateCallbackResult::Valid);
                        }
                    };
                    match link_type {
                        LinkTypes::AllCravingRecipes => {
                            validate_delete_link_all_craving_recipes(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                        LinkTypes::LobbyInfoUpdates => {
                            validate_delete_link_lobby_info_updates(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                        LinkTypes::AnchorToLobbyInfo => {
                            validate_delete_link_anchor_to_lobby_infos(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                    }
                }
                OpRecord::CreatePrivateEntry { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::UpdatePrivateEntry { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::CreateCapClaim { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::CreateCapGrant { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::UpdateCapClaim { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::UpdateCapGrant { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::Dna { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::OpenChain { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::CloseChain { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::InitZomesComplete { .. } => Ok(ValidateCallbackResult::Valid),
                _ => Ok(ValidateCallbackResult::Valid),
            }
        }
        OpType::RegisterAgentActivity(agent_activity) => {
            match agent_activity {
                OpActivity::CreateAgent { agent, action } => {
                    let previous_action = must_get_action(action.prev_action)?;
                    match previous_action.action() {
                        Action::AgentValidationPkg(
                            AgentValidationPkg { membrane_proof, .. },
                        ) => validate_agent_joining(agent, membrane_proof),
                        _ => {
                            Ok(
                                ValidateCallbackResult::Invalid(
                                    "The previous action for a `CreateAgent` action must be an `AgentValidationPkg`"
                                        .to_string(),
                                ),
                            )
                        }
                    }
                }
                _ => Ok(ValidateCallbackResult::Valid),
            }
        }
    }
}
