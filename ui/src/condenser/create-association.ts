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
import { Association } from './types';
import { CondenserStore } from '../condenser-store';
import { MVBTextField } from '../components/mvb-textfield';

@customElement('create-association')
export class CreateAssociation extends LitElement {
  @consume({ context: clientContext })
  client!: AppAgentClient;

  @consume({ context: condenserContext })
  _store!: CondenserStore;

  @property({ type: Object })
  cravingCellId!: CellId;

  @state()
  _association: string | undefined;

  isAssociationValid() {
    return (
      true && this._association !== undefined && this._association.length > 2
    );
  }

  async createAssociation() {
    const association: Association = {
      association: this._association!,
    };

    try {
      const record: Record = await this.client.callZome({
        cap_secret: null,
        cell_id: this.cravingCellId,
        zome_name: 'craving',
        fn_name: 'create_association',
        payload: association,
      });

      // console.log("@create-association: Created association.");

      this.dispatchEvent(
        new CustomEvent('association-created', {
          composed: true,
          bubbles: true,
          detail: {
            associationHash: record.signed_action.hashed.hash,
          },
        }),
      );

      (
        this.shadowRoot?.getElementById('association-textfield') as MVBTextField
      ).clear();
    } catch (e: any) {
      const errorSnackbar = this.shadowRoot?.getElementById(
        'create-error',
      ) as Snackbar;
      errorSnackbar.labelText = `Error creating the association: ${e.data.data}`;
      errorSnackbar.show();
    }
  }

  render() {
    return html` <mwc-snackbar id="create-error" leading> </mwc-snackbar>

      <div
        style="display: flex; flex-direction: column; align-items: center; margin-bottom: 20px;"
      >
        <div class="row" style="display: flex; align-items: center;">
          <mvb-textfield
            id="association-textfield"
            style="
              --mvb-primary-color: #abb5d6;
              --mvb-secondary-color: #838ba4;
              --mvb-textfield-width: 350px;
              --mvb-textfield-height: 50px;
              --border-width: 1px;
            "
            placeholder="Add association"
            @input=${(e: CustomEvent) => {
              this._association = (e.target as any).value;
            }}
            title="Type a word that you associate with the craving's description"
            required
            @keypress=${(e: KeyboardEvent) =>
              e.key === 'Enter' ? this.createAssociation() : undefined}
          ></mvb-textfield>
          <btn-round
            style="margin-left: 10px; font-size: 18px"
            title="Add this association to the list for others to see"
            .disabled=${!this.isAssociationValid()}
            @click=${() => this.createAssociation()}
          >
            Add
          </btn-round>
        </div>
      </div>`;
  }
}
