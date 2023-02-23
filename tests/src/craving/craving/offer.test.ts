import test from 'node:test';
import assert from 'node:assert';

import { runScenario, pause, CallableCell } from '@holochain/tryorama';
import { NewEntryAction, ActionHash, Record, AppBundleSource } from '@holochain/client';
import { decode } from '@msgpack/msgpack';


async function sampleOffer(cell: CallableCell, partialOffer = {}) {
    return {
        ...{
	  offer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
	  explanation: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        },
        ...partialOffer
    };
}

export async function createOffer(cell: CallableCell, offer = undefined): Promise<Record> {
    return cell.callZome({
      zome_name: "craving",
      fn_name: "create_offer",
      payload: offer || await sampleOffer(cell),
    });
}

test('create Offer', { concurrency: 1 }, async t => {
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

    // Alice creates a Offer
    const record: Record = await createOffer(alice.cells[0]);
    assert.ok(record);
  });
});

test('create and read Offer', { concurrency: 1 }, async t => {
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

    const sample = await sampleOffer(alice.cells[0]);

    // Alice creates a Offer
    const record: Record = await createOffer(alice.cells[0], sample);
    assert.ok(record);

    // Wait for the created entry to be propagated to the other node.
    await pause(1200);

    // Bob gets the created Offer
    const createReadOutput: Record = await bob.cells[0].callZome({
      zome_name: "craving",
      fn_name: "get_offer",
      payload: record.signed_action.hashed.hash,
    });
    assert.deepEqual(sample, decode((createReadOutput.entry as any).Present.entry) as any);
  });
});

test('create and update Offer', { concurrency: 1 }, async t => {
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

    // Alice creates a Offer
    const record: Record = await createOffer(alice.cells[0]);
    assert.ok(record);
        
    const originalActionHash = record.signed_action.hashed.hash;
 
    // Alice updates the Offer
    let contentUpdate: any = await sampleOffer(alice.cells[0]);
    let updateInput = {
      original_offer_hash: originalActionHash,
      previous_offer_hash: originalActionHash,
      updated_offer: contentUpdate,
    };

    let updatedRecord: Record = await alice.cells[0].callZome({
      zome_name: "craving",
      fn_name: "update_offer",
      payload: updateInput,
    });
    assert.ok(updatedRecord);

    // Wait for the updated entry to be propagated to the other node.
    await pause(1200);
        
    // Bob gets the updated Offer
    const readUpdatedOutput0: Record = await bob.cells[0].callZome({
      zome_name: "craving",
      fn_name: "get_offer",
      payload: updatedRecord.signed_action.hashed.hash,
    });
    assert.deepEqual(contentUpdate, decode((readUpdatedOutput0.entry as any).Present.entry) as any);

    // Alice updates the Offer again
    contentUpdate = await sampleOffer(alice.cells[0]);
    updateInput = { 
      original_offer_hash: originalActionHash,
      previous_offer_hash: updatedRecord.signed_action.hashed.hash,
      updated_offer: contentUpdate,
    };

    updatedRecord = await alice.cells[0].callZome({
      zome_name: "craving",
      fn_name: "update_offer",
      payload: updateInput,
    });
    assert.ok(updatedRecord);

    // Wait for the updated entry to be propagated to the other node.
    await pause(1200);
        
    // Bob gets the updated Offer
    const readUpdatedOutput1: Record = await bob.cells[0].callZome({
      zome_name: "craving",
      fn_name: "get_offer",
      payload: updatedRecord.signed_action.hashed.hash,
    });
    assert.deepEqual(contentUpdate, decode((readUpdatedOutput1.entry as any).Present.entry) as any);
  });
});

test('create and delete Offer', { concurrency: 1 }, async t => {
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

    // Alice creates a Offer
    const record: Record = await createOffer(alice.cells[0]);
    assert.ok(record);
        
    // Alice deletes the Offer
    const deleteActionHash = await alice.cells[0].callZome({
      zome_name: "craving",
      fn_name: "delete_offer",
      payload: record.signed_action.hashed.hash,
    });
    assert.ok(deleteActionHash);

    // Wait for the entry deletion to be propagated to the other node.
    await pause(1200);
        
    // Bob tries to get the deleted Offer
    const readDeletedOutput = await bob.cells[0].callZome({
      zome_name: "craving",
      fn_name: "get_offer",
      payload: record.signed_action.hashed.hash,
    });
    assert.equal(readDeletedOutput, undefined);
  });
});
