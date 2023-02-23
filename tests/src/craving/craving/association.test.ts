import test from 'node:test';
import assert from 'node:assert';

import { runScenario, pause, CallableCell } from '@holochain/tryorama';
import { NewEntryAction, ActionHash, Record, AppBundleSource } from '@holochain/client';
import { decode } from '@msgpack/msgpack';


async function sampleAssociation(cell: CallableCell, partialAssociation = {}) {
    return {
        ...{
	  association: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        },
        ...partialAssociation
    };
}

export async function createAssociation(cell: CallableCell, association = undefined): Promise<Record> {
    return cell.callZome({
      zome_name: "craving",
      fn_name: "create_association",
      payload: association || await sampleAssociation(cell),
    });
}

test('create Association', { concurrency: 1 }, async t => {
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

    // Alice creates a Association
    const record: Record = await createAssociation(alice.cells[0]);
    assert.ok(record);
  });
});

test('create and read Association', { concurrency: 1 }, async t => {
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

    const sample = await sampleAssociation(alice.cells[0]);

    // Alice creates a Association
    const record: Record = await createAssociation(alice.cells[0], sample);
    assert.ok(record);

    // Wait for the created entry to be propagated to the other node.
    await pause(1200);

    // Bob gets the created Association
    const createReadOutput: Record = await bob.cells[0].callZome({
      zome_name: "craving",
      fn_name: "get_association",
      payload: record.signed_action.hashed.hash,
    });
    assert.deepEqual(sample, decode((createReadOutput.entry as any).Present.entry) as any);
  });
});

test('create and update Association', { concurrency: 1 }, async t => {
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

    // Alice creates a Association
    const record: Record = await createAssociation(alice.cells[0]);
    assert.ok(record);
        
    const originalActionHash = record.signed_action.hashed.hash;
 
    // Alice updates the Association
    let contentUpdate: any = await sampleAssociation(alice.cells[0]);
    let updateInput = {
      original_association_hash: originalActionHash,
      previous_association_hash: originalActionHash,
      updated_association: contentUpdate,
    };

    let updatedRecord: Record = await alice.cells[0].callZome({
      zome_name: "craving",
      fn_name: "update_association",
      payload: updateInput,
    });
    assert.ok(updatedRecord);

    // Wait for the updated entry to be propagated to the other node.
    await pause(1200);
        
    // Bob gets the updated Association
    const readUpdatedOutput0: Record = await bob.cells[0].callZome({
      zome_name: "craving",
      fn_name: "get_association",
      payload: updatedRecord.signed_action.hashed.hash,
    });
    assert.deepEqual(contentUpdate, decode((readUpdatedOutput0.entry as any).Present.entry) as any);

    // Alice updates the Association again
    contentUpdate = await sampleAssociation(alice.cells[0]);
    updateInput = { 
      original_association_hash: originalActionHash,
      previous_association_hash: updatedRecord.signed_action.hashed.hash,
      updated_association: contentUpdate,
    };

    updatedRecord = await alice.cells[0].callZome({
      zome_name: "craving",
      fn_name: "update_association",
      payload: updateInput,
    });
    assert.ok(updatedRecord);

    // Wait for the updated entry to be propagated to the other node.
    await pause(1200);
        
    // Bob gets the updated Association
    const readUpdatedOutput1: Record = await bob.cells[0].callZome({
      zome_name: "craving",
      fn_name: "get_association",
      payload: updatedRecord.signed_action.hashed.hash,
    });
    assert.deepEqual(contentUpdate, decode((readUpdatedOutput1.entry as any).Present.entry) as any);
  });
});

test('create and delete Association', { concurrency: 1 }, async t => {
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

    // Alice creates a Association
    const record: Record = await createAssociation(alice.cells[0]);
    assert.ok(record);
        
    // Alice deletes the Association
    const deleteActionHash = await alice.cells[0].callZome({
      zome_name: "craving",
      fn_name: "delete_association",
      payload: record.signed_action.hashed.hash,
    });
    assert.ok(deleteActionHash);

    // Wait for the entry deletion to be propagated to the other node.
    await pause(1200);
        
    // Bob tries to get the deleted Association
    const readDeletedOutput = await bob.cells[0].callZome({
      zome_name: "craving",
      fn_name: "get_association",
      payload: record.signed_action.hashed.hash,
    });
    assert.equal(readDeletedOutput, undefined);
  });
});
