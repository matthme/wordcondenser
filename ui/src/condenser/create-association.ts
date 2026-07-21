import { LitElement, html } from 'lit';
import { state, customElement, property } from 'lit/decorators.js';
import { Record, AppClient, CellId, ActionHash } from '@holochain/client';
import { consume } from '@lit-labs/context';
import '@material/mwc-button';
import '@material/mwc-snackbar';
import { Snackbar } from '@material/mwc-snackbar';
import '@material/mwc-textfield';

import '../components/btn-round';
import '../components/mvb-textfield';

import { clientContext, cravingStoreContext } from '../contexts';
import { Association } from './types';
import { MVBTextField } from '../components/mvb-textfield';
import { CravingStore } from '../craving-store';
import { sharedStyles } from '../sharedStyles';

@customElement('create-association')
export class CreateAssociation extends LitElement {
  @consume({ context: clientContext })
  client!: AppClient;

  @consume({ context: cravingStoreContext })
  _cravingStore!: CravingStore;

  @property({ type: Object })
  cravingHash!: ActionHash;

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
      const entryRecord =
        await this._cravingStore.service.createAssociation(association);

      this.dispatchEvent(
        new CustomEvent('association-created', {
          composed: true,
          bubbles: true,
          detail: {
            associationHash: entryRecord?.actionHash,
          },
        }),
      );

      this._cravingStore.allAssociations.reload();

      (
        this.shadowRoot?.getElementById('association-textfield') as MVBTextField
      ).clear();
    } catch (e: any) {
      console.error(e);
      const errorSnackbar = this.shadowRoot?.getElementById(
        'create-error',
      ) as Snackbar;
      errorSnackbar.labelText = `Error creating the association: ${e}`;
      errorSnackbar.show();
    }
  }

  render() {
    return html` <mwc-snackbar id="create-error" leading> </mwc-snackbar>

      <div class="column flex-1 align-center" style="margin-bottom: 20px;">
        <div class="row flex-1 align-center">
          <mvb-textfield
            id="association-textfield"
            style="
              --mvb-primary-color: #abb5d6;
              --mvb-secondary-color: #838ba4;
              --mvb-textfield-height: 50px;
              --mvb-textfield-width: 320px;
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
          <span class="flex-1"></span>
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

  static styles = [sharedStyles];
}
