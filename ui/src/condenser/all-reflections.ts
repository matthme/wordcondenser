import { LitElement, html } from 'lit';
import { state, customElement, property } from 'lit/decorators.js';
import {
  Record,
  AppAgentClient,
  CellId,
  AgentPubKey,
  ActionHash,
} from '@holochain/client';
import { consume } from '@lit-labs/context';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import '@material/mwc-circular-progress';
import { decodeEntry } from '@holochain-open-dev/utils';

import './association-map-element';
import { CravingStore } from '../craving-store';
import { Reflection } from './types';
import { clientContext, condenserContext, cravingStoreContext } from '../contexts';
import { CondenserStore } from '../condenser-store';


export interface ReflectionData {
  reflection: Reflection,
  timestamp: number,
  author: AgentPubKey,
  actionHash: ActionHash,
}


@customElement('all-reflections')
export class AllReflections extends LitElement {
  @consume({ context: clientContext })
  client!: AppAgentClient;

  @consume({ context: condenserContext })
  _condenserStore!: CondenserStore;

  @property({ type: Object })
  cravingCellId!: CellId;

  @state()
  sortBy: 'latest' | 'mostComments' = 'latest';

  @consume({ context: cravingStoreContext })
  _store!: CravingStore;

  private _allReflections = new StoreSubscriber(
    this,
    () => this._store.allReflections
  );

  renderList(reflections: Array<Record>) {
    if (reflections.length === 0)
    return html`<div style="font-size: 23px; margin-top: 40px; margin-bottom: 70px; color: #929ab9;"
      >No reflections found for this craving.</div
      >`;

    let reflectionDatas: (ReflectionData | undefined)[] = reflections.map((record) => {
      const reflection = record ? (decodeEntry(record) as Reflection) : undefined;

      return reflection
        ? {
          reflection,
          timestamp: record.signed_action.hashed.content.timestamp,
          author: record.signed_action.hashed.content.author,
          actionHash: record.signed_action.hashed.hash,
        }
        : undefined;
    })
    .filter((data) => !!data)
    .sort((reflectionData_a, reflectionData_b) => reflectionData_b!.timestamp - reflectionData_a!.timestamp);


    return html`
      <div style="display: flex; flex-direction: column">
        ${reflectionDatas.map(
          (reflection) =>
            html`<reflection-element
              .reflection=${reflection}
            ></reflection-element>`
        )}
      </div>
    `;
  }

  render() {
    switch (this._allReflections.value.status) {
      case "pending":
        return html`loading...`;
      case "error":
        return html`ERROR`
      case "complete":
        return this.renderList(this._allReflections.value.value);
    }
  }
}
