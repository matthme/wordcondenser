use hdk::prelude::*;
use cravings_integrity::*;
#[hdk_extern]
pub fn create_dna_recipe(dna_recipe: DnaRecipe) -> ExternResult<Record> {
    // check that there is not already an entry for this recipe
    let dna_recipe_entry_hash = hash_entry(&EntryTypes::DnaRecipe(dna_recipe.clone()))?;
    let maybe_record = get(dna_recipe_entry_hash, GetOptions::default())?;
    if let Some(_record) = maybe_record {
        return Err(wasm_error!(WasmErrorInner::Guest(String::from("An entry for this DnaRecipe exists already."))));
    }

    let dna_recipe_hash = create_entry(&EntryTypes::DnaRecipe(dna_recipe.clone()))?;
    let record = get(dna_recipe_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly created DnaRecipe"))
            ),
        )?;
    let path = Path::from("all_craving_recipes");
    create_link(
        path.path_entry_hash()?,
        dna_recipe_hash.clone(),
        LinkTypes::AllCravingRecipes,
        (),
    )?;
    Ok(record)
}
#[hdk_extern]
pub fn get_dna_recipe(dna_recipe_hash: ActionHash) -> ExternResult<Option<Record>> {
    get(dna_recipe_hash, GetOptions::default())
}
