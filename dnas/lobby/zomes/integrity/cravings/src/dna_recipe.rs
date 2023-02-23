use hdi::prelude::*;

#[derive(Clone, Serialize, Deserialize, Debug, SerializedBytes)]
pub struct CravingDnaProperties {
    pub title: String,
    pub description: String,
    pub max_anecdote_chars: Option<usize>,
    pub max_association_chars: Option<usize>,
    pub max_offer_chars: Option<usize>,
    pub max_reflection_chars: Option<usize>,
}

#[hdk_entry_helper]
#[derive(Clone)]
pub struct DnaRecipe {
    pub title: String,
    pub network_seed: Option<String>,
    pub properties: CravingDnaProperties, // the properties consist only of the public key of the original poster in B64 format
    pub origin_time: Option<Timestamp>,
    pub membrane_proof: Option<MembraneProof>,
    pub resulting_dna_hash: DnaHash,
}
pub fn validate_create_dna_recipe(
    _action: EntryCreationAction,
    _dna_recipe: DnaRecipe,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_update_dna_recipe(
    _action: Update,
    _dna_recipe: DnaRecipe,
    _original_action: EntryCreationAction,
    _original_dna_recipe: DnaRecipe,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from("Dna Recipes cannot be updated")))
}
pub fn validate_delete_dna_recipe(
    _action: Delete,
    _original_action: EntryCreationAction,
    _original_dna_recipe: DnaRecipe,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from("Dna Recipes cannot be deleted")))
}
pub fn validate_create_link_all_craving_recipes(
    _action: CreateLink,
    _base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let action_hash = ActionHash::from(target_address);
    let record = must_get_valid_record(action_hash)?;
    let _dna_recipe: crate::DnaRecipe = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Linked action must reference an entry"))
            ),
        )?;
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_all_craving_recipes(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(
        ValidateCallbackResult::Invalid(
            String::from("AllCravingRecipes links cannot be deleted"),
        ),
    )
}
