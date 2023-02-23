import test from 'node:test';
import assert from 'node:assert';

import { runScenario, pause, CallableCell } from '@holochain/tryorama';
import { NewEntryAction, ActionHash, Record, AppBundleSource } from '@holochain/client';
import { decode } from '@msgpack/msgpack';


async function sampleDnaRecipe(cell: CallableCell, partialDnaRecipe = {}) {
    return {
        ...{
	  network_seed: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
	  properties: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
	  origin_time: 1674053334548000,
	  clone_name: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
	  membrane_proof: 0.5,
        },
        ...partialDnaRecipe
    };
}

export async function createDnaRecipe(cell: CallableCell, dnaRecipe = undefined): Promise<Record> {
    return cell.callZome({
      zome_name: "cravings",
      fn_name: "create_dna_recipe",
      payload: dnaRecipe || await sampleDnaRecipe(cell),
    });
}

test('create DnaRecipe', { concurrency: 1 }, async t => {
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

    // Alice creates a DnaRecipe
    const record: Record = await createDnaRecipe(alice.cells[0]);
    assert.ok(record);
  });
});

test('create and read DnaRecipe', { concurrency: 1 }, async t => {
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

    const sample = await sampleDnaRecipe(alice.cells[0]);

    // Alice creates a DnaRecipe
    const record: Record = await createDnaRecipe(alice.cells[0], sample);
    assert.ok(record);

    // Wait for the created entry to be propagated to the other node.
    await pause(1200);

    // Bob gets the created DnaRecipe
    const createReadOutput: Record = await bob.cells[0].callZome({
      zome_name: "cravings",
      fn_name: "get_dna_recipe",
      payload: record.signed_action.hashed.hash,
    });
    assert.deepEqual(sample, decode((createReadOutput.entry as any).Present.entry) as any);
  });
});


