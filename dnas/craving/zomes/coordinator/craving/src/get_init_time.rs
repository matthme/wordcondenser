use hdk::prelude::*;

#[hdk_extern]
pub fn get_init_time(_: ()) -> ExternResult<Timestamp> {
    let filter = ChainQueryFilter::new()
        .action_type(ActionType::Dna);

    let query_result = query(filter)?;
    match query_result.first() {
        Some(record) => Ok(record.action().timestamp()),
        None => Err(wasm_error!(WasmErrorInner::Guest("Failed to get the DNA Record.".into())))
    }
}