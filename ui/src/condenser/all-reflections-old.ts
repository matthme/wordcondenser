import { LitElement, html } from 'lit';
import { state, customElement } from 'lit/decorators.js';
import { AppAgentClient, ActionHash, Record } from '@holochain/client';
import { consume } from '@lit-labs/context';
import { Task } from '@lit-labs/task';
import { clientContext } from '../contexts';
import '@material/mwc-circular-progress';

import './reflection-detail';

@customElement('all-reflections')
export class AllReflections extends LitElement {
  @consume({ context: clientContext })
  client!: AppAgentClient;

  @state()
  signaledHashes: Array<ActionHash> = [];

  _fetchReflections = new Task(this, ([]) => this.client.callZome({
      cap_secret: null,
      role_name: 'craving',
      zome_name: 'craving',
      fn_name: 'get_all_reflections',
      payload: null,
  }) as Promise<Array<Record>>, () => []);

  firstUpdated() {
    this.client.on('signal', signal => {
      const payload = signal.payload as any;
      if (!(signal.zome_name === 'craving' && payload.type === 'EntryCreated')) return;
      if (payload.app_entry.type !== 'Reflection') return;
      this.signaledHashes = [payload.action.hashed.hash, ...this.signaledHashes];
    });
  }

  renderList(hashes: Array<ActionHash>) {
    if (hashes.length === 0) return html`<span>No reflections found.</span>`;

    return html`
      <div style="display: flex; flex-direction: column">
        ${hashes.map(hash =>
          html`<reflection-detail .reflectionHash=${hash} style="margin-bottom: 16px;" @reflection-deleted=${() => { this._fetchReflections.run(); this.signaledHashes = []; } }></reflection-detail>`
        )}
      </div>
    `;
  }

  render() {
    return this._fetchReflections.render({
      pending: () => html`<div style="display: flex; flex: 1; align-items: center; justify-content: center">
        <mwc-circular-progress indeterminate></mwc-circular-progress>
      </div>`,
      complete: (records) => this.renderList([...this.signaledHashes, ...records.map(r => r.signed_action.hashed.hash)]),
      error: (e: any) => html`<span>Error fetching the reflections: ${e.data.data}.</span>`
    });
  }
}
