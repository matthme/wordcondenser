import test from 'node:test';
import assert from 'node:assert';

import { runScenario, pause, CallableCell } from '@holochain/tryorama';
import { NewEntryAction, ActionHash, Record, AppBundleSource } from '@holochain/client';
import { decode } from '@msgpack/msgpack';


async function sampleReflection(cell: CallableCell, partialReflection = {}) {
    return {
        ...{
	  reflection: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        },
        ...partialReflection
    };
}

export async function createReflection(cell: CallableCell, reflection = undefined): Promise<Record> {
    return cell.callZome({
      zome_name: "craving",
      fn_name: "create_reflection",
      payload: reflection || await sampleReflection(cell),
    });
}

test('create Reflection', { concurrency: 1 }, async t => {
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

    // Alice creates a Reflection
    const record: Record = await createReflection(alice.cells[0]);
    assert.ok(record);
  });
});

test('create and read Reflection', { concurrency: 1 }, async t => {
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

    const sample = await sampleReflection(alice.cells[0]);

    // Alice creates a Reflection
    const record: Record = await createReflection(alice.cells[0], sample);
    assert.ok(record);

    // Wait for the created entry to be propagated to the other node.
    await pause(1200);

    // Bob gets the created Reflection
    const createReadOutput: Record = await bob.cells[0].callZome({
      zome_name: "craving",
      fn_name: "get_reflection",
      payload: record.signed_action.hashed.hash,
    });
    assert.deepEqual(sample, decode((createReadOutput.entry as any).Present.entry) as any);
  });
});

test('create and update Reflection', { concurrency: 1 }, async t => {
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

    // Alice creates a Reflection
    const record: Record = await createReflection(alice.cells[0]);
    assert.ok(record);
        
    const originalActionHash = record.signed_action.hashed.hash;
 
    // Alice updates the Reflection
    let contentUpdate: any = await sampleReflection(alice.cells[0]);
    let updateInput = {
      original_reflection_hash: originalActionHash,
      previous_reflection_hash: originalActionHash,
      updated_reflection: contentUpdate,
    };

    let updatedRecord: Record = await alice.cells[0].callZome({
      zome_name: "craving",
      fn_name: "update_reflection",
      payload: updateInput,
    });
    assert.ok(updatedRecord);

    // Wait for the updated entry to be propagated to the other node.
    await pause(1200);
        
    // Bob gets the updated Reflection
    const readUpdatedOutput0: Record = await bob.cells[0].callZome({
      zome_name: "craving",
      fn_name: "get_reflection",
      payload: updatedRecord.signed_action.hashed.hash,
    });
    assert.deepEqual(contentUpdate, decode((readUpdatedOutput0.entry as any).Present.entry) as any);

    // Alice updates the Reflection again
    contentUpdate = await sampleReflection(alice.cells[0]);
    updateInput = { 
      original_reflection_hash: originalActionHash,
      previous_reflection_hash: updatedRecord.signed_action.hashed.hash,
      updated_reflection: contentUpdate,
    };

    updatedRecord = await alice.cells[0].callZome({
      zome_name: "craving",
      fn_name: "update_reflection",
      payload: updateInput,
    });
    assert.ok(updatedRecord);

    // Wait for the updated entry to be propagated to the other node.
    await pause(1200);
        
    // Bob gets the updated Reflection
    const readUpdatedOutput1: Record = await bob.cells[0].callZome({
      zome_name: "craving",
      fn_name: "get_reflection",
      payload: updatedRecord.signed_action.hashed.hash,
    });
    assert.deepEqual(contentUpdate, decode((readUpdatedOutput1.entry as any).Present.entry) as any);
  });
});

test('create and delete Reflection', { concurrency: 1 }, async t => {
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

    // Alice creates a Reflection
    const record: Record = await createReflection(alice.cells[0]);
    assert.ok(record);
        
    // Alice deletes the Reflection
    const deleteActionHash = await alice.cells[0].callZome({
      zome_name: "craving",
      fn_name: "delete_reflection",
      payload: record.signed_action.hashed.hash,
    });
    assert.ok(deleteActionHash);

    // Wait for the entry deletion to be propagated to the other node.
    await pause(1200);
        
    // Bob tries to get the deleted Reflection
    const readDeletedOutput = await bob.cells[0].callZome({
      zome_name: "craving",
      fn_name: "get_reflection",
      payload: record.signed_action.hashed.hash,
    });
    assert.equal(readDeletedOutput, undefined);
  });
});
