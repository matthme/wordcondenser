import test from 'node:test';
import assert from 'node:assert';

import { runScenario, pause, CallableCell } from '@holochain/tryorama';
import { NewEntryAction, ActionHash, Record, AppBundleSource } from '@holochain/client';
import { decode } from '@msgpack/msgpack';


async function sampleLobbyInfo(cell: CallableCell, partialLobbyInfo = {}) {
    return {
        ...{
	  description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
	  logo_src: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        },
        ...partialLobbyInfo
    };
}

export async function createLobbyInfo(cell: CallableCell, lobbyInfo = undefined): Promise<Record> {
    return cell.callZome({
      zome_name: "cravings",
      fn_name: "create_lobby_info",
      payload: lobbyInfo || await sampleLobbyInfo(cell),
    });
}

test('create LobbyInfo', { concurrency: 1 }, async t => {
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

    // Alice creates a LobbyInfo
    const record: Record = await createLobbyInfo(alice.cells[0]);
    assert.ok(record);
  });
});

test('create and read LobbyInfo', { concurrency: 1 }, async t => {
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

    const sample = await sampleLobbyInfo(alice.cells[0]);

    // Alice creates a LobbyInfo
    const record: Record = await createLobbyInfo(alice.cells[0], sample);
    assert.ok(record);

    // Wait for the created entry to be propagated to the other node.
    await pause(1200);

    // Bob gets the created LobbyInfo
    const createReadOutput: Record = await bob.cells[0].callZome({
      zome_name: "cravings",
      fn_name: "get_lobby_info",
      payload: record.signed_action.hashed.hash,
    });
    assert.deepEqual(sample, decode((createReadOutput.entry as any).Present.entry) as any);
  });
});

test('create and update LobbyInfo', { concurrency: 1 }, async t => {
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

    // Alice creates a LobbyInfo
    const record: Record = await createLobbyInfo(alice.cells[0]);
    assert.ok(record);
        
    const originalActionHash = record.signed_action.hashed.hash;
 
    // Alice updates the LobbyInfo
    let contentUpdate: any = await sampleLobbyInfo(alice.cells[0]);
    let updateInput = {
      original_lobby_info_hash: originalActionHash,
      previous_lobby_info_hash: originalActionHash,
      updated_lobby_info: contentUpdate,
    };

    let updatedRecord: Record = await alice.cells[0].callZome({
      zome_name: "cravings",
      fn_name: "update_lobby_info",
      payload: updateInput,
    });
    assert.ok(updatedRecord);

    // Wait for the updated entry to be propagated to the other node.
    await pause(1200);
        
    // Bob gets the updated LobbyInfo
    const readUpdatedOutput0: Record = await bob.cells[0].callZome({
      zome_name: "cravings",
      fn_name: "get_lobby_info",
      payload: updatedRecord.signed_action.hashed.hash,
    });
    assert.deepEqual(contentUpdate, decode((readUpdatedOutput0.entry as any).Present.entry) as any);

    // Alice updates the LobbyInfo again
    contentUpdate = await sampleLobbyInfo(alice.cells[0]);
    updateInput = { 
      original_lobby_info_hash: originalActionHash,
      previous_lobby_info_hash: updatedRecord.signed_action.hashed.hash,
      updated_lobby_info: contentUpdate,
    };

    updatedRecord = await alice.cells[0].callZome({
      zome_name: "cravings",
      fn_name: "update_lobby_info",
      payload: updateInput,
    });
    assert.ok(updatedRecord);

    // Wait for the updated entry to be propagated to the other node.
    await pause(1200);
        
    // Bob gets the updated LobbyInfo
    const readUpdatedOutput1: Record = await bob.cells[0].callZome({
      zome_name: "cravings",
      fn_name: "get_lobby_info",
      payload: updatedRecord.signed_action.hashed.hash,
    });
    assert.deepEqual(contentUpdate, decode((readUpdatedOutput1.entry as any).Present.entry) as any);
  });
});

