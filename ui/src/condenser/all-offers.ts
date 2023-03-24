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
import { CravingStore, OfferData } from '../craving-store';
import { clientContext, condenserContext, cravingStoreContext } from '../contexts';
import { CondenserStore } from '../condenser-store';
import { sharedStyles } from '../sharedStyles';




@customElement('all-offers')
export class AllOffers extends LitElement {
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

  private _allOffers = new StoreSubscriber(
    this,
    () => this._store.allOffers
  );



  renderList(offerDatas: Array<OfferData>) {
    if (offerDatas.length === 0)
    return html`
      <div class="column" style="flex: 1; align-items: center;">
        <div style="font-size: 23px; padding-top: 50px; text-align: center; max-width: 400px; color: #929ab9;">
          No offers found for this craving.
        </div>
      </div>`;

    if (this.sortBy === "resonanceAbsolute") {
      offerDatas = offerDatas.sort((data_a, data_b) => data_b.resonators.length - data_a.resonators.length);
    } else if (this.sortBy === "latest") {
      offerDatas = offerDatas.sort((data_a, data_b) => data_b.timestamp - data_a.timestamp);
    }


    return html`
      <div style="display: flex; flex-direction: column; margin: 8px;">
        ${offerDatas.map(
          (offer) =>
            html`<offer-element
              .offer=${offer}
            ></offer-element>`
        )}
      </div>
    `;
  }

  render() {
    switch (this._allOffers.value.status) {
      case "pending":
        return html`loading...`;
      case "error":
        return html`ERROR`
      case "complete":
        // update offers count in localStorage
        this._store.updateOffersCount(this._allOffers.value.value.length);
        return this.renderList(this._allOffers.value.value);
    }
  }

  static styles = [
    sharedStyles,
    css``
  ];
}
