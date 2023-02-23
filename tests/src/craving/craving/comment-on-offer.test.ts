import test from 'node:test';
import assert from 'node:assert';

import { runScenario, pause, CallableCell } from '@holochain/tryorama';
import { NewEntryAction, ActionHash, Record, AppBundleSource } from '@holochain/client';
import { decode } from '@msgpack/msgpack';

import { createOffer } from './offer.test.js';

async function sampleCommentOnOffer(cell: CallableCell, partialCommentOnOffer = {}) {
    return {
        ...{
          offer_hash: (await createOffer(cell)).signed_action.hashed.hash,
	  comment: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        },
        ...partialCommentOnOffer
    };
}

export async function createCommentOnOffer(cell: CallableCell, commentOnOffer = undefined): Promise<Record> {
    return cell.callZome({
      zome_name: "craving",
      fn_name: "create_comment_on_offer",
      payload: commentOnOffer || await sampleCommentOnOffer(cell),
    });
}

test('create CommentOnOffer', { concurrency: 1 }, async t => {
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

    // Alice creates a CommentOnOffer
    const record: Record = await createCommentOnOffer(alice.cells[0]);
    assert.ok(record);
  });
});

test('create and read CommentOnOffer', { concurrency: 1 }, async t => {
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

    const sample = await sampleCommentOnOffer(alice.cells[0]);

    // Alice creates a CommentOnOffer
    const record: Record = await createCommentOnOffer(alice.cells[0], sample);
    assert.ok(record);

    // Wait for the created entry to be propagated to the other node.
    await pause(1200);

    // Bob gets the created CommentOnOffer
    const createReadOutput: Record = await bob.cells[0].callZome({
      zome_name: "craving",
      fn_name: "get_comment_on_offer",
      payload: record.signed_action.hashed.hash,
    });
    assert.deepEqual(sample, decode((createReadOutput.entry as any).Present.entry) as any);
  });
});

test('create and update CommentOnOffer', { concurrency: 1 }, async t => {
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

    // Alice creates a CommentOnOffer
    const record: Record = await createCommentOnOffer(alice.cells[0]);
    assert.ok(record);
        
    const originalActionHash = record.signed_action.hashed.hash;
 
    // Alice updates the CommentOnOffer
    let contentUpdate: any = await sampleCommentOnOffer(alice.cells[0]);
    let updateInput = {
      original_comment_on_offer_hash: originalActionHash,
      previous_comment_on_offer_hash: originalActionHash,
      updated_comment_on_offer: contentUpdate,
    };

    let updatedRecord: Record = await alice.cells[0].callZome({
      zome_name: "craving",
      fn_name: "update_comment_on_offer",
      payload: updateInput,
    });
    assert.ok(updatedRecord);

    // Wait for the updated entry to be propagated to the other node.
    await pause(1200);
        
    // Bob gets the updated CommentOnOffer
    const readUpdatedOutput0: Record = await bob.cells[0].callZome({
      zome_name: "craving",
      fn_name: "get_comment_on_offer",
      payload: updatedRecord.signed_action.hashed.hash,
    });
    assert.deepEqual(contentUpdate, decode((readUpdatedOutput0.entry as any).Present.entry) as any);

    // Alice updates the CommentOnOffer again
    contentUpdate = await sampleCommentOnOffer(alice.cells[0]);
    updateInput = { 
      original_comment_on_offer_hash: originalActionHash,
      previous_comment_on_offer_hash: updatedRecord.signed_action.hashed.hash,
      updated_comment_on_offer: contentUpdate,
    };

    updatedRecord = await alice.cells[0].callZome({
      zome_name: "craving",
      fn_name: "update_comment_on_offer",
      payload: updateInput,
    });
    assert.ok(updatedRecord);

    // Wait for the updated entry to be propagated to the other node.
    await pause(1200);
        
    // Bob gets the updated CommentOnOffer
    const readUpdatedOutput1: Record = await bob.cells[0].callZome({
      zome_name: "craving",
      fn_name: "get_comment_on_offer",
      payload: updatedRecord.signed_action.hashed.hash,
    });
    assert.deepEqual(contentUpdate, decode((readUpdatedOutput1.entry as any).Present.entry) as any);
  });
});

test('create and delete CommentOnOffer', { concurrency: 1 }, async t => {
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

    // Alice creates a CommentOnOffer
    const record: Record = await createCommentOnOffer(alice.cells[0]);
    assert.ok(record);
        
    // Alice deletes the CommentOnOffer
    const deleteActionHash = await alice.cells[0].callZome({
      zome_name: "craving",
      fn_name: "delete_comment_on_offer",
      payload: record.signed_action.hashed.hash,
    });
    assert.ok(deleteActionHash);

    // Wait for the entry deletion to be propagated to the other node.
    await pause(1200);
        
    // Bob tries to get the deleted CommentOnOffer
    const readDeletedOutput = await bob.cells[0].callZome({
      zome_name: "craving",
      fn_name: "get_comment_on_offer",
      payload: record.signed_action.hashed.hash,
    });
    assert.equal(readDeletedOutput, undefined);
  });
});
