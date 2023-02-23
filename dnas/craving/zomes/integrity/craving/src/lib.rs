pub mod action_to_resonator;
pub use action_to_resonator::*;
pub mod entry_to_resonator;
pub use entry_to_resonator::*;
pub mod comment_on_reflection;
pub use comment_on_reflection::*;
pub mod comment_on_offer;
pub use comment_on_offer::*;
pub mod anecdote;
pub use anecdote::*;
pub mod association;
pub use association::*;
pub mod reflection;
pub use reflection::*;
pub mod offer;
pub use offer::*;
pub mod types;
use hdi::prelude::*;
#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
#[hdk_entry_defs]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    Offer(Offer),
    Reflection(Reflection),
    Association(Association),
    Anecdote(Anecdote),
    CommentOnOffer(CommentOnOffer),
    CommentOnReflection(CommentOnReflection),
}
#[derive(Serialize, Deserialize)]
#[hdk_link_types]
pub enum LinkTypes {
    OfferUpdates,
    ReflectionUpdates,
    AssociationUpdates,
    AnecdoteUpdates,
    OfferToCommentOnOffers,
    CommentOnOfferUpdates,
    ReflectionToCommentOnReflections,
    CommentOnReflectionUpdates,
    EntryToResonator,
    ActionToResonator,
    AllOffers,
    AllAssociations,
    AllReflections,
    AllAnecdotes,
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
                        EntryTypes::Offer(offer) => {
                            validate_create_offer(
                                EntryCreationAction::Create(action),
                                offer,
                            )
                        }
                        EntryTypes::Reflection(reflection) => {
                            validate_create_reflection(
                                EntryCreationAction::Create(action),
                                reflection,
                            )
                        }
                        EntryTypes::Association(association) => {
                            validate_create_association(
                                EntryCreationAction::Create(action),
                                association,
                            )
                        }
                        EntryTypes::Anecdote(anecdote) => {
                            validate_create_anecdote(
                                EntryCreationAction::Create(action),
                                anecdote,
                            )
                        }
                        EntryTypes::CommentOnOffer(comment_on_offer) => {
                            validate_create_comment_on_offer(
                                EntryCreationAction::Create(action),
                                comment_on_offer,
                            )
                        }
                        EntryTypes::CommentOnReflection(comment_on_reflection) => {
                            validate_create_comment_on_reflection(
                                EntryCreationAction::Create(action),
                                comment_on_reflection,
                            )
                        }
                    }
                }
                OpEntry::UpdateEntry { app_entry, action, .. } => {
                    match app_entry {
                        EntryTypes::Offer(offer) => {
                            validate_create_offer(
                                EntryCreationAction::Update(action),
                                offer,
                            )
                        }
                        EntryTypes::Reflection(reflection) => {
                            validate_create_reflection(
                                EntryCreationAction::Update(action),
                                reflection,
                            )
                        }
                        EntryTypes::Association(association) => {
                            validate_create_association(
                                EntryCreationAction::Update(action),
                                association,
                            )
                        }
                        EntryTypes::Anecdote(anecdote) => {
                            validate_create_anecdote(
                                EntryCreationAction::Update(action),
                                anecdote,
                            )
                        }
                        EntryTypes::CommentOnOffer(comment_on_offer) => {
                            validate_create_comment_on_offer(
                                EntryCreationAction::Update(action),
                                comment_on_offer,
                            )
                        }
                        EntryTypes::CommentOnReflection(comment_on_reflection) => {
                            validate_create_comment_on_reflection(
                                EntryCreationAction::Update(action),
                                comment_on_reflection,
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
                            EntryTypes::CommentOnReflection(comment_on_reflection),
                            EntryTypes::CommentOnReflection(
                                original_comment_on_reflection,
                            ),
                        ) => {
                            validate_update_comment_on_reflection(
                                action,
                                comment_on_reflection,
                                original_action,
                                original_comment_on_reflection,
                            )
                        }
                        (
                            EntryTypes::CommentOnOffer(comment_on_offer),
                            EntryTypes::CommentOnOffer(original_comment_on_offer),
                        ) => {
                            validate_update_comment_on_offer(
                                action,
                                comment_on_offer,
                                original_action,
                                original_comment_on_offer,
                            )
                        }
                        (
                            EntryTypes::Anecdote(anecdote),
                            EntryTypes::Anecdote(original_anecdote),
                        ) => {
                            validate_update_anecdote(
                                action,
                                anecdote,
                                original_action,
                                original_anecdote,
                            )
                        }
                        (
                            EntryTypes::Association(association),
                            EntryTypes::Association(original_association),
                        ) => {
                            validate_update_association(
                                action,
                                association,
                                original_action,
                                original_association,
                            )
                        }
                        (
                            EntryTypes::Reflection(reflection),
                            EntryTypes::Reflection(original_reflection),
                        ) => {
                            validate_update_reflection(
                                action,
                                reflection,
                                original_action,
                                original_reflection,
                            )
                        }
                        (EntryTypes::Offer(offer), EntryTypes::Offer(original_offer)) => {
                            validate_update_offer(
                                action,
                                offer,
                                original_action,
                                original_offer,
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
                        EntryTypes::Offer(offer) => {
                            validate_delete_offer(action, original_action, offer)
                        }
                        EntryTypes::Reflection(reflection) => {
                            validate_delete_reflection(
                                action,
                                original_action,
                                reflection,
                            )
                        }
                        EntryTypes::Association(association) => {
                            validate_delete_association(
                                action,
                                original_action,
                                association,
                            )
                        }
                        EntryTypes::Anecdote(anecdote) => {
                            validate_delete_anecdote(action, original_action, anecdote)
                        }
                        EntryTypes::CommentOnOffer(comment_on_offer) => {
                            validate_delete_comment_on_offer(
                                action,
                                original_action,
                                comment_on_offer,
                            )
                        }
                        EntryTypes::CommentOnReflection(comment_on_reflection) => {
                            validate_delete_comment_on_reflection(
                                action,
                                original_action,
                                comment_on_reflection,
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
                LinkTypes::OfferUpdates => {
                    validate_create_link_offer_updates(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::ReflectionUpdates => {
                    validate_create_link_reflection_updates(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::AssociationUpdates => {
                    validate_create_link_association_updates(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::AnecdoteUpdates => {
                    validate_create_link_anecdote_updates(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::OfferToCommentOnOffers => {
                    validate_create_link_offer_to_comment_on_offers(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::CommentOnOfferUpdates => {
                    validate_create_link_comment_on_offer_updates(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::ReflectionToCommentOnReflections => {
                    validate_create_link_reflection_to_comment_on_reflections(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::CommentOnReflectionUpdates => {
                    validate_create_link_comment_on_reflection_updates(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::EntryToResonator => {
                    validate_create_link_entry_to_resonator(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::ActionToResonator => {
                    validate_create_link_action_to_resonator(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::AllOffers => {
                    validate_create_link_all_offers(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::AllAssociations => {
                    validate_create_link_all_associations(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::AllReflections => {
                    validate_create_link_all_reflections(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::AllAnecdotes => {
                    validate_create_link_all_anecdotes(
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
                LinkTypes::OfferUpdates => {
                    validate_delete_link_offer_updates(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::ReflectionUpdates => {
                    validate_delete_link_reflection_updates(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::AssociationUpdates => {
                    validate_delete_link_association_updates(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::AnecdoteUpdates => {
                    validate_delete_link_anecdote_updates(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::OfferToCommentOnOffers => {
                    validate_delete_link_offer_to_comment_on_offers(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::CommentOnOfferUpdates => {
                    validate_delete_link_comment_on_offer_updates(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::ReflectionToCommentOnReflections => {
                    validate_delete_link_reflection_to_comment_on_reflections(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::CommentOnReflectionUpdates => {
                    validate_delete_link_comment_on_reflection_updates(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::EntryToResonator => {
                    validate_delete_link_entry_to_resonator(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::ActionToResonator => {
                    validate_delete_link_action_to_resonator(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::AllOffers => {
                    validate_delete_link_all_offers(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::AllAssociations => {
                    validate_delete_link_all_associations(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::AllReflections => {
                    validate_delete_link_all_reflections(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::AllAnecdotes => {
                    validate_delete_link_all_anecdotes(
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
                        EntryTypes::Offer(offer) => {
                            validate_create_offer(
                                EntryCreationAction::Create(action),
                                offer,
                            )
                        }
                        EntryTypes::Reflection(reflection) => {
                            validate_create_reflection(
                                EntryCreationAction::Create(action),
                                reflection,
                            )
                        }
                        EntryTypes::Association(association) => {
                            validate_create_association(
                                EntryCreationAction::Create(action),
                                association,
                            )
                        }
                        EntryTypes::Anecdote(anecdote) => {
                            validate_create_anecdote(
                                EntryCreationAction::Create(action),
                                anecdote,
                            )
                        }
                        EntryTypes::CommentOnOffer(comment_on_offer) => {
                            validate_create_comment_on_offer(
                                EntryCreationAction::Create(action),
                                comment_on_offer,
                            )
                        }
                        EntryTypes::CommentOnReflection(comment_on_reflection) => {
                            validate_create_comment_on_reflection(
                                EntryCreationAction::Create(action),
                                comment_on_reflection,
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
                        EntryTypes::Offer(offer) => {
                            let result = validate_create_offer(
                                EntryCreationAction::Update(action.clone()),
                                offer.clone(),
                            )?;
                            if let ValidateCallbackResult::Valid = result {
                                let original_offer: Option<Offer> = original_record
                                    .entry()
                                    .to_app_option()
                                    .map_err(|e| wasm_error!(e))?;
                                let original_offer = match original_offer {
                                    Some(offer) => offer,
                                    None => {
                                        return Ok(
                                            ValidateCallbackResult::Invalid(
                                                "The updated entry type must be the same as the original entry type"
                                                    .to_string(),
                                            ),
                                        );
                                    }
                                };
                                validate_update_offer(
                                    action,
                                    offer,
                                    original_action,
                                    original_offer,
                                )
                            } else {
                                Ok(result)
                            }
                        }
                        EntryTypes::Reflection(reflection) => {
                            let result = validate_create_reflection(
                                EntryCreationAction::Update(action.clone()),
                                reflection.clone(),
                            )?;
                            if let ValidateCallbackResult::Valid = result {
                                let original_reflection: Option<Reflection> = original_record
                                    .entry()
                                    .to_app_option()
                                    .map_err(|e| wasm_error!(e))?;
                                let original_reflection = match original_reflection {
                                    Some(reflection) => reflection,
                                    None => {
                                        return Ok(
                                            ValidateCallbackResult::Invalid(
                                                "The updated entry type must be the same as the original entry type"
                                                    .to_string(),
                                            ),
                                        );
                                    }
                                };
                                validate_update_reflection(
                                    action,
                                    reflection,
                                    original_action,
                                    original_reflection,
                                )
                            } else {
                                Ok(result)
                            }
                        }
                        EntryTypes::Association(association) => {
                            let result = validate_create_association(
                                EntryCreationAction::Update(action.clone()),
                                association.clone(),
                            )?;
                            if let ValidateCallbackResult::Valid = result {
                                let original_association: Option<Association> = original_record
                                    .entry()
                                    .to_app_option()
                                    .map_err(|e| wasm_error!(e))?;
                                let original_association = match original_association {
                                    Some(association) => association,
                                    None => {
                                        return Ok(
                                            ValidateCallbackResult::Invalid(
                                                "The updated entry type must be the same as the original entry type"
                                                    .to_string(),
                                            ),
                                        );
                                    }
                                };
                                validate_update_association(
                                    action,
                                    association,
                                    original_action,
                                    original_association,
                                )
                            } else {
                                Ok(result)
                            }
                        }
                        EntryTypes::Anecdote(anecdote) => {
                            let result = validate_create_anecdote(
                                EntryCreationAction::Update(action.clone()),
                                anecdote.clone(),
                            )?;
                            if let ValidateCallbackResult::Valid = result {
                                let original_anecdote: Option<Anecdote> = original_record
                                    .entry()
                                    .to_app_option()
                                    .map_err(|e| wasm_error!(e))?;
                                let original_anecdote = match original_anecdote {
                                    Some(anecdote) => anecdote,
                                    None => {
                                        return Ok(
                                            ValidateCallbackResult::Invalid(
                                                "The updated entry type must be the same as the original entry type"
                                                    .to_string(),
                                            ),
                                        );
                                    }
                                };
                                validate_update_anecdote(
                                    action,
                                    anecdote,
                                    original_action,
                                    original_anecdote,
                                )
                            } else {
                                Ok(result)
                            }
                        }
                        EntryTypes::CommentOnOffer(comment_on_offer) => {
                            let result = validate_create_comment_on_offer(
                                EntryCreationAction::Update(action.clone()),
                                comment_on_offer.clone(),
                            )?;
                            if let ValidateCallbackResult::Valid = result {
                                let original_comment_on_offer: Option<CommentOnOffer> = original_record
                                    .entry()
                                    .to_app_option()
                                    .map_err(|e| wasm_error!(e))?;
                                let original_comment_on_offer = match original_comment_on_offer {
                                    Some(comment_on_offer) => comment_on_offer,
                                    None => {
                                        return Ok(
                                            ValidateCallbackResult::Invalid(
                                                "The updated entry type must be the same as the original entry type"
                                                    .to_string(),
                                            ),
                                        );
                                    }
                                };
                                validate_update_comment_on_offer(
                                    action,
                                    comment_on_offer,
                                    original_action,
                                    original_comment_on_offer,
                                )
                            } else {
                                Ok(result)
                            }
                        }
                        EntryTypes::CommentOnReflection(comment_on_reflection) => {
                            let result = validate_create_comment_on_reflection(
                                EntryCreationAction::Update(action.clone()),
                                comment_on_reflection.clone(),
                            )?;
                            if let ValidateCallbackResult::Valid = result {
                                let original_comment_on_reflection: Option<
                                    CommentOnReflection,
                                > = original_record
                                    .entry()
                                    .to_app_option()
                                    .map_err(|e| wasm_error!(e))?;
                                let original_comment_on_reflection = match original_comment_on_reflection {
                                    Some(comment_on_reflection) => comment_on_reflection,
                                    None => {
                                        return Ok(
                                            ValidateCallbackResult::Invalid(
                                                "The updated entry type must be the same as the original entry type"
                                                    .to_string(),
                                            ),
                                        );
                                    }
                                };
                                validate_update_comment_on_reflection(
                                    action,
                                    comment_on_reflection,
                                    original_action,
                                    original_comment_on_reflection,
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
                        EntryTypes::Offer(original_offer) => {
                            validate_delete_offer(
                                action,
                                original_action,
                                original_offer,
                            )
                        }
                        EntryTypes::Reflection(original_reflection) => {
                            validate_delete_reflection(
                                action,
                                original_action,
                                original_reflection,
                            )
                        }
                        EntryTypes::Association(original_association) => {
                            validate_delete_association(
                                action,
                                original_action,
                                original_association,
                            )
                        }
                        EntryTypes::Anecdote(original_anecdote) => {
                            validate_delete_anecdote(
                                action,
                                original_action,
                                original_anecdote,
                            )
                        }
                        EntryTypes::CommentOnOffer(original_comment_on_offer) => {
                            validate_delete_comment_on_offer(
                                action,
                                original_action,
                                original_comment_on_offer,
                            )
                        }
                        EntryTypes::CommentOnReflection(
                            original_comment_on_reflection,
                        ) => {
                            validate_delete_comment_on_reflection(
                                action,
                                original_action,
                                original_comment_on_reflection,
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
                        LinkTypes::OfferUpdates => {
                            validate_create_link_offer_updates(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                        LinkTypes::ReflectionUpdates => {
                            validate_create_link_reflection_updates(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                        LinkTypes::AssociationUpdates => {
                            validate_create_link_association_updates(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                        LinkTypes::AnecdoteUpdates => {
                            validate_create_link_anecdote_updates(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                        LinkTypes::OfferToCommentOnOffers => {
                            validate_create_link_offer_to_comment_on_offers(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                        LinkTypes::CommentOnOfferUpdates => {
                            validate_create_link_comment_on_offer_updates(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                        LinkTypes::ReflectionToCommentOnReflections => {
                            validate_create_link_reflection_to_comment_on_reflections(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                        LinkTypes::CommentOnReflectionUpdates => {
                            validate_create_link_comment_on_reflection_updates(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                        LinkTypes::EntryToResonator => {
                            validate_create_link_entry_to_resonator(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                        LinkTypes::ActionToResonator => {
                            validate_create_link_action_to_resonator(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                        LinkTypes::AllOffers => {
                            validate_create_link_all_offers(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                        LinkTypes::AllAssociations => {
                            validate_create_link_all_associations(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                        LinkTypes::AllReflections => {
                            validate_create_link_all_reflections(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                        LinkTypes::AllAnecdotes => {
                            validate_create_link_all_anecdotes(
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
                        LinkTypes::OfferUpdates => {
                            validate_delete_link_offer_updates(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                        LinkTypes::ReflectionUpdates => {
                            validate_delete_link_reflection_updates(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                        LinkTypes::AssociationUpdates => {
                            validate_delete_link_association_updates(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                        LinkTypes::AnecdoteUpdates => {
                            validate_delete_link_anecdote_updates(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                        LinkTypes::OfferToCommentOnOffers => {
                            validate_delete_link_offer_to_comment_on_offers(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                        LinkTypes::CommentOnOfferUpdates => {
                            validate_delete_link_comment_on_offer_updates(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                        LinkTypes::ReflectionToCommentOnReflections => {
                            validate_delete_link_reflection_to_comment_on_reflections(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                        LinkTypes::CommentOnReflectionUpdates => {
                            validate_delete_link_comment_on_reflection_updates(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                        LinkTypes::EntryToResonator => {
                            validate_delete_link_entry_to_resonator(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                        LinkTypes::ActionToResonator => {
                            validate_delete_link_action_to_resonator(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                        LinkTypes::AllOffers => {
                            validate_delete_link_all_offers(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                        LinkTypes::AllAssociations => {
                            validate_delete_link_all_associations(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                        LinkTypes::AllReflections => {
                            validate_delete_link_all_reflections(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                        LinkTypes::AllAnecdotes => {
                            validate_delete_link_all_anecdotes(
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
