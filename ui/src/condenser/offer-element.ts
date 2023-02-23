import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { AppAgentClient, NewEntryAction } from '@holochain/client';
import { consume } from '@lit-labs/context';
import '@material/mwc-circular-progress';
import '@material/mwc-icon-button';
import '@material/mwc-snackbar';

import { clientContext, cravingStoreContext } from '../contexts';
import { sharedStyles } from '../sharedStyles';
import { getHexColorForTimestamp } from '../colors';
import { CravingStore, OfferData } from '../craving-store';
import { decodeEntry } from '@holochain-open-dev/utils';
import { Offer } from './types';
import { classMap } from 'lit/directives/class-map.js';


/** An element of the association map for a craving.
 *
 * It determines its size based on the age of the association entry and the number
 * of "resonates" it has.
 *
 * */
@customElement('offer-element')
export class OfferElement extends LitElement {
  @consume({ context: clientContext })
  client!: AppAgentClient;

  @consume({ context: cravingStoreContext })
  store!: CravingStore;

  @property()
  offer!: OfferData;


  async handleResonator() {
    console.log(":::HANDLING RESONATOR:::");
    if (this.offer.iResonated) {
      await this.unresonate();
    } else {
      await this.resonate()
    }
  }


  async resonate() {
    const entryHash = (this.offer.record.signed_action.hashed.content as NewEntryAction).entry_hash;
    try {
      await this.store.service.resonateWithEntry(entryHash);
      // timeout required, otherwise it for some reason misses things...
      setTimeout(() => this.requestUpdate(), 50);
    } catch (e) {
      console.log("ERROR trying to resonate: ", e);
    }
  }

  async unresonate() {
    const entryHash = (this.offer.record.signed_action.hashed.content as NewEntryAction).entry_hash;
    try {
      await this.store.service.unresonateWithEntry(entryHash);
      // timeout required, otherwise it for some reason misses things...
      setTimeout(() => this.requestUpdate(), 50);
    } catch (e) {
      console.log("ERROR trying to unresonate: ", e);
    }
  }


  renderOffer() {

    const color = getHexColorForTimestamp(this.offer.timestamp);

    const offer = decodeEntry(this.offer.record) as Offer;

    const date = new Date(this.offer.timestamp/1000);

    return html`
      <div class="offer" title="${date.toLocaleString()}">
 	      <div style="white-space: pre-line; text-align: left;">${ offer.offer }</div>
        <span style="display: flex; flex: 1;"></span>
        <div
          style="align-items: center;"
          class="row resonator ${ classMap({
            resonated: this.offer.iResonated,
          })}"
          title=${this.offer.iResonated ? "drop it?" : "add your fog to it"}
          @click=${async () => await this.handleResonator()}
        >
          <img src="drop.svg" style="height: 23px; margin-top: -2px; ${this.offer.iResonated ? "" : "opacity: 0.8;"}">
          <span style="margin-left: 5px;">${this.offer.resonators.length}</span>
        </div>
      </div>
    `;
  }


  render() {
    return html`
      ${this.renderOffer()}
      `
  }

  static styles = [sharedStyles, css`

    .offer {
      background-color: #ffd72335;
      color: rgb(var(--font-active-color));
      font-size: 24px;
      padding: 8px 12px;
      display: flex;
      flex-direction: row;
      align-items: center;
      border-radius: 15px;
      margin: 5px 10px;
    }

    .resonator {
      padding: 2px 10px;
      border-radius: 12px;
      justify-content: center;
      width: 35px;
      cursor: pointer;
      color: rgb(var(--font-active-color));
      border: 1px solid transparent;
      font-size: 24px;
    }

    .resonator:hover {
      border: 1px solid rgb(var(--font-active-color));
    }

    .resonated {
      border: 1px solid rgb(var(--font-active-color));
    }
  `];
}
