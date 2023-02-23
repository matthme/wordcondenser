import test from 'node:test';
import assert from 'node:assert';

import { runScenario, pause, CallableCell } from '@holochain/tryorama';
import { NewEntryAction, ActionHash, Record, AppBundleSource } from '@holochain/client';
import { decode } from '@msgpack/msgpack';

import { createDnaRecipe } from './dna-recipe.test.js';

test('create a DnaRecipe and get all craving recipes', { concurrency: 1 }, async t => {
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

    // Bob gets all craving recipes
    let collectionOutput: Record[] = await bob.cells[0].callZome({
      zome_name: "cravings",
      fn_name: "get_all_craving_recipes",
      payload: null
    });
    assert.equal(collectionOutput.length, 0);

    // Alice creates a DnaRecipe
    const createdRecord: Record = await createDnaRecipe(alice.cells[0]);
    assert.ok(createdRecord);
    
    await pause(1200);
    
    // Bob gets all craving recipes again
    collectionOutput = await bob.cells[0].callZome({
      zome_name: "cravings",
      fn_name: "get_all_craving_recipes",
      payload: null
    });
    assert.equal(collectionOutput.length, 1);
    assert.deepEqual(createdRecord, collectionOutput[0]);    
  });
});

