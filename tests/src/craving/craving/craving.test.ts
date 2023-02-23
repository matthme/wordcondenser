import test from 'node:test';
import assert from 'node:assert';

import { runScenario, pause, CallableCell } from '@holochain/tryorama';
import { NewEntryAction, ActionHash, Record, AppBundleSource } from '@holochain/client';
import { decode } from '@msgpack/msgpack';


async function sampleCraving(cell: CallableCell, partialCraving = {}) {
    return {
        ...{
	  title: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
	  description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
	  max_association_chars: 10,
	  max_reflection_chars: 10,
	  max_offer_chars: 10,
	  max_anecdote_chars: 10,
        },
        ...partialCraving
    };
}

export async function createCraving(cell: CallableCell, craving = undefined): Promise<Record> {
    return cell.callZome({
      zome_name: "craving",
      fn_name: "create_craving",
      payload: craving || await sampleCraving(cell),
    });
}

test('create Craving', { concurrency: 1 }, async t => {
  await runScenario(async scenario => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + '/../workdir/word-condenser.happ';

    // Set up the app to be installed 
    const appSource = { appBundleSource: { path: testAppPath } };

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([appSource, appSource]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();

    // Alice creates a Craving
    const record: Record = await createCraving(alice.cells[0]);
    assert.ok(record);
  });
});

test('create and read Craving', { concurrency: 1 }, async t => {
  await runScenario(async scenario => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + '/../workdir/word-condenser.happ';

    // Set up the app to be installed 
    const appSource = { appBundleSource: { path: testAppPath } };

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([appSource, appSource]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();

    const sample = await sampleCraving(alice.cells[0]);

    // Alice creates a Craving
    const record: Record = await createCraving(alice.cells[0], sample);
    assert.ok(record);

    // Wait for the created entry to be propagated to the other node.
    await pause(1200);

    // Bob gets the created Craving
    const createReadOutput: Record = await bob.cells[0].callZome({
      zome_name: "craving",
      fn_name: "get_craving",
      payload: record.signed_action.hashed.hash,
    });
    assert.deepEqual(sample, decode((createReadOutput.entry as any).Present.entry) as any);
  });
});

test('create and update Craving', { concurrency: 1 }, async t => {
  await runScenario(async scenario => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + '/../workdir/word-condenser.happ';

    // Set up the app to be installed 
    const appSource = { appBundleSource: { path: testAppPath } };

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([appSource, appSource]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();

    // Alice creates a Craving
    const record: Record = await createCraving(alice.cells[0]);
    assert.ok(record);
        
    const originalActionHash = record.signed_action.hashed.hash;
 
    // Alice updates the Craving
    let contentUpdate: any = await sampleCraving(alice.cells[0]);
    let updateInput = {
      original_craving_hash: originalActionHash,
      previous_craving_hash: originalActionHash,
      updated_craving: contentUpdate,
    };

    let updatedRecord: Record = await alice.cells[0].callZome({
      zome_name: "craving",
      fn_name: "update_craving",
      payload: updateInput,
    });
    assert.ok(updatedRecord);

    // Wait for the updated entry to be propagated to the other node.
    await pause(1200);
        
    // Bob gets the updated Craving
    const readUpdatedOutput0: Record = await bob.cells[0].callZome({
      zome_name: "craving",
      fn_name: "get_craving",
      payload: updatedRecord.signed_action.hashed.hash,
    });
    assert.deepEqual(contentUpdate, decode((readUpdatedOutput0.entry as any).Present.entry) as any);

    // Alice updates the Craving again
    contentUpdate = await sampleCraving(alice.cells[0]);
    updateInput = { 
      original_craving_hash: originalActionHash,
      previous_craving_hash: updatedRecord.signed_action.hashed.hash,
      updated_craving: contentUpdate,
    };

    updatedRecord = await alice.cells[0].callZome({
      zome_name: "craving",
      fn_name: "update_craving",
      payload: updateInput,
    });
    assert.ok(updatedRecord);

    // Wait for the updated entry to be propagated to the other node.
    await pause(1200);
        
    // Bob gets the updated Craving
    const readUpdatedOutput1: Record = await bob.cells[0].callZome({
      zome_name: "craving",
      fn_name: "get_craving",
      payload: updatedRecord.signed_action.hashed.hash,
    });
    assert.deepEqual(contentUpdate, decode((readUpdatedOutput1.entry as any).Present.entry) as any);
  });
});

test('create and delete Craving', { concurrency: 1 }, async t => {
  await runScenario(async scenario => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + '/../workdir/word-condenser.happ';

    // Set up the app to be installed 
    const appSource = { appBundleSource: { path: testAppPath } };

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([appSource, appSource]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();

    // Alice creates a Craving
    const record: Record = await createCraving(alice.cells[0]);
    assert.ok(record);
        
    // Alice deletes the Craving
    const deleteActionHash = await alice.cells[0].callZome({
      zome_name: "craving",
      fn_name: "delete_craving",
      payload: record.signed_action.hashed.hash,
    });
    assert.ok(deleteActionHash);

    // Wait for the entry deletion to be propagated to the other node.
    await pause(1200);
        
    // Bob tries to get the deleted Craving
    const readDeletedOutput = await bob.cells[0].callZome({
      zome_name: "craving",
      fn_name: "get_craving",
      payload: record.signed_action.hashed.hash,
    });
    assert.equal(readDeletedOutput, undefined);
  });
});
