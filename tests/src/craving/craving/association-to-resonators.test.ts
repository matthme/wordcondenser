import test from 'node:test';
import assert from 'node:assert';

import { runScenario, pause, CallableCell } from '@holochain/tryorama';
import { NewEntryAction, ActionHash, Record, AppBundleSource } from '@holochain/client';
import { decode } from '@msgpack/msgpack';

import { createAssociation } from './association.test.js';

test('link a Association to a Resonator', { concurrency: 1 }, async t => {
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

    const baseRecord = await createAssociation(alice.cells[0]);
    const baseAddress = (baseRecord.signed_action.hashed.content as NewEntryAction).entry_hash;
    const targetAddress = alice.agentPubKey;

    // Bob gets the links, should be empty
    let linksOutput: Record[] = await bob.cells[0].callZome({
      zome_name: "craving",
      fn_name: "get_resonators_for_association",
      payload: baseAddress
    });
    assert.equal(linksOutput.length, 0);

    // Alice creates a link from Association to Resonator
    await alice.cells[0].callZome({
      zome_name: "craving",
      fn_name: "add_resonator_for_association",
      payload: {
        association_hash: baseAddress,
        resonator: targetAddress
      }
    });
    
    await pause(1200);
    
    // Bob gets the links again
    linksOutput = await bob.cells[0].callZome({
      zome_name: "craving",
      fn_name: "get_resonators_for_association",
      payload: baseAddress
    });
    assert.equal(linksOutput.length, 1);


    await alice.cells[0].callZome({
      zome_name: "craving",
      fn_name: "remove_resonator_for_association",
      payload: {
        association_hash: baseAddress,
        resonator: targetAddress
      }
    });
    
    await pause(1200);

    // Bob gets the links again
    linksOutput = await bob.cells[0].callZome({
      zome_name: "craving",
      fn_name: "get_resonators_for_association",
      payload: baseAddress
    });
    assert.equal(linksOutput.length, 0);


  });
});

