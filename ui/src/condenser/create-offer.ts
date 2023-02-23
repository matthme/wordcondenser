import { LitElement, html } from 'lit';
import { state, customElement, property } from 'lit/decorators.js';
import { Record, AppAgentClient, CellId } from '@holochain/client';
import { consume } from '@lit-labs/context';
import '@material/mwc-button';
import '@material/mwc-snackbar';
import { Snackbar } from '@material/mwc-snackbar';
import '@material/mwc-textfield';

import '../components/btn-round';
import '../components/mvb-textfield';

import { clientContext, condenserContext } from '../contexts';
import { Offer } from './types';
import { CondenserStore } from '../condenser-store';
import { MVBTextField } from '../components/mvb-textfield';

@customElement('create-offer')
export class CreateOffer extends LitElement {
  @consume({ context: clientContext })
  client!: AppAgentClient;

  @consume({ context: condenserContext })
  _store!: CondenserStore;

  @property({ type: Object })
  cravingCellId!: CellId;


  @state()
  _offer: string | undefined;


  isOfferValid() {
    return true && this._offer !== undefined && this._offer.length > 2;
  }

  async createOffer() {
    const offer: Offer = {
        offer: this._offer!,
        explanation: undefined,
    };

    try {
      const record: Record = await this.client.callZome({
        cap_secret: null,
        cell_id: this.cravingCellId,
        zome_name: 'craving',
        fn_name: 'create_offer',
        payload: offer,
      });

      this.dispatchEvent(new CustomEvent('offer-created', {
        composed: true,
        bubbles: true,
        detail: {
          offerHash: record.signed_action.hashed.hash
        }
      }));
      this._offer = undefined;

      (this.shadowRoot?.getElementById("offer-textfield") as MVBTextField).clear();

    } catch (e: any) {
      const errorSnackbar = this.shadowRoot?.getElementById('create-error') as Snackbar;
      errorSnackbar.labelText = `Error creating the offer: ${e.data.data}`;
      errorSnackbar.show();
      throw new Error(`Failed to create offer: ${e}`);
    }
  }

  render() {
    return html`
      <mwc-snackbar id="create-error" leading>
      </mwc-snackbar>

      <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 20px;">

        <div class="row" style="display: flex; align-items: center;">
          <mvb-textfield
            id="offer-textfield"
            style="
              --mvb-primary-color: #abb5d6;
              --mvb-secondary-color: #838ba4;
              --mvb-textfield-width: 370px;
              --mvb-textfield-height: 50px;
              --border-width: 1px;
            "
            placeholder="Add offer"
            @input=${(e: CustomEvent) => {
              this._offer = (e.target as any).value;
            }}
            title="Got a precious drop of liquified grammatical potential? Share it, make it real!"
            required
            @keypress=${(e: KeyboardEvent) => e.key === 'Enter' ? this.createOffer() : undefined}
          ></mvb-textfield>
          <btn-round
            style="margin-left: 10px; font-size: 18px"
            title="Add this offer to the list for others to see"
            .disabled=${!this.isOfferValid()}
            @click=${() => this.createOffer()}
          >
          Add
          </btn-round>
        </div>
    </div>`;
  }
}
