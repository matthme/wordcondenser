import { LitElement, html, css } from 'lit';
import { state, customElement, property } from 'lit/decorators.js';
import { AppClient, CellId } from '@holochain/client';
import { consume } from '@lit-labs/context';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import '@material/mwc-circular-progress';

import './association-map-element';
import { CravingStore, OfferData } from '../craving-store';
import {
  clientContext,
  condenserContext,
  cravingStoreContext,
} from '../contexts';
import { CondenserStore } from '../condenser-store';
import { sharedStyles } from '../sharedStyles';

@customElement('all-offers')
export class AllOffers extends LitElement {
  @consume({ context: clientContext })
  client!: AppClient;

  @property({ type: Object })
  cravingCellId!: CellId;

  @state()
  sortBy: 'latest' | 'resonanceTimeRatio' | 'resonanceAbsolute' =
    'resonanceAbsolute';

  @consume({ context: cravingStoreContext })
  _cravingStore!: CravingStore;

  private _allOffers = new StoreSubscriber(
    this,
    () => this._cravingStore.allOffers,
  );

  renderList(offerDatasInput: Array<OfferData>) {
    let offerDatas = offerDatasInput;
    if (offerDatas.length === 0)
      return html` <div class="column" style="flex: 1; align-items: center;">
        <div
          style="font-size: 21px; padding-top: 50px; text-align: center; max-width: 400px; color: #929ab9;"
        >
          No offers found for this craving.
        </div>
      </div>`;

    if (this.sortBy === 'resonanceAbsolute') {
      offerDatas = offerDatas
        .sort((data_a, data_b) => data_b.timestamp - data_a.timestamp)
        .sort(
          (data_a, data_b) =>
            data_b.resonators.length - data_a.resonators.length,
        );
    } else if (this.sortBy === 'latest') {
      offerDatas = offerDatas.sort(
        (data_a, data_b) => data_b.timestamp - data_a.timestamp,
      );
    }

    return html`
      <div style="display: flex; flex-direction: column; margin: 8px;">
        ${offerDatas.map(
          offer => html`<offer-element .offer=${offer}></offer-element>`,
        )}
      </div>
    `;
  }

  render() {
    switch (this._allOffers.value.status) {
      case 'pending':
        return html`loading...`;
      case 'error':
        return html`ERROR`;
      case 'complete':
        // update offers count in localStorage
        this._cravingStore.updateOffersCount(
          this._allOffers.value.value.length,
        );
        return this.renderList(this._allOffers.value.value);
      default:
        return html`You found the border of the universe...`;
    }
  }

  static styles = [sharedStyles, css``];
}
