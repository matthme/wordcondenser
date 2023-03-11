import { LitElement, html, css } from 'lit';
import { state, customElement, property } from 'lit/decorators.js';
import {
  AppAgentClient,
  CellId,
} from '@holochain/client';
import { consume } from '@lit-labs/context';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import '@material/mwc-circular-progress';

import './association-map-element';
import { AssociationData, CravingStore } from '../craving-store';
import { clientContext, condenserContext, cravingStoreContext } from '../contexts';
import { CondenserStore } from '../condenser-store';
import { sharedStyles } from '../sharedStyles';


@customElement('association-map')
export class AssociationMap extends LitElement {
  @consume({ context: clientContext })
  client!: AppAgentClient;

  @consume({ context: condenserContext })
  _condenserStore!: CondenserStore;

  @property({ type: Object })
  cravingCellId!: CellId;

  @state()
  sortBy: 'latest' | 'resonanceTimeRatio' | 'resonanceAbsolute' = 'resonanceAbsolute';

  @consume({ context: cravingStoreContext })
  _store!: CravingStore;

  private _allAssociations = new StoreSubscriber(
    this,
    () => this._store.allAssociations
  );


  renderList(associationDatas: Array<AssociationData>) {
    if (associationDatas.length === 0)
      return html`
      <div class="column" style="flex: 1; align-items: center;">
        <div style="font-size: 23px; padding-top: 50px; text-align: center; max-width: 400px; color: #929ab9;">
          No associations found for this craving.
        </div>
      </div>`;


    if (this.sortBy === "resonanceAbsolute") {
      associationDatas = associationDatas
        .sort((data_a, data_b) => data_b.timestamp - data_a.timestamp)
        .sort((data_a, data_b) => data_b.resonators.length - data_a.resonators.length);
    } else if (this.sortBy === "latest") {
      associationDatas = associationDatas.sort((data_a, data_b) => data_b.timestamp - data_a.timestamp);
    }


    return html`
      <div style="display: flex; flex-direction: column; margin: 8px;">
        ${associationDatas.map(
          (association) => {
            return html`<association-map-element
              .association=${association}
            ></association-map-element>`
          }
        )}
      </div>
    `;
  }

  render() {
    switch (this._allAssociations.value.status) {
      case "pending":
        return html`loading...`;
      case "error":
        return html`ERROR`
      case "complete":
        return this.renderList(this._allAssociations.value.value);
    }
  }


  static styles = [
    sharedStyles,
    css``
  ];
}
