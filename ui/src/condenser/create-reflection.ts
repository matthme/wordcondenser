import { LitElement, html, css } from 'lit';
import { state, customElement, property, query } from 'lit/decorators.js';
import { Record, AppAgentClient, CellId } from '@holochain/client';
import { consume } from '@lit-labs/context';
import '@material/mwc-button';
import '@material/mwc-snackbar';
import { Snackbar } from '@material/mwc-snackbar';
import '@material/mwc-textfield';

import '../components/btn-round';
import '../components/mvb-textfield';

import { clientContext, condenserContext } from '../contexts';
import { Reflection } from './types';
import { CondenserStore } from '../condenser-store';
import { MVBTextField } from '../components/mvb-textfield';
import { MVBTextArea } from '../components/mvb-textarea';
import { sharedStyles } from '../sharedStyles';

@customElement('create-reflection')
export class CreateOffer extends LitElement {
  @consume({ context: clientContext })
  client!: AppAgentClient;

  @consume({ context: condenserContext })
  _store!: CondenserStore;

  @property({ type: Object })
  cravingCellId!: CellId;


  @state()
  _reflection: string | undefined;

  @state()
  _title: string | undefined;

  @query("#title-field")
  titleField!: MVBTextField;

  @query("#reflection-field")
  reflectionField!: MVBTextArea;

  isReflectionValid() {
    return true && this._reflection !== undefined && this._reflection.length > 2;
  }

  isTitleValid() {
    return true && this._title !== undefined && this._title.length > 2;
  }


  async createReflection() {
    const reflection: Reflection = {
      title: this._title!,
      reflection: this._reflection!,
    };


    try {
      const record: Record = await this.client.callZome({
        cap_secret: null,
        cell_id: this.cravingCellId,
        zome_name: 'craving',
        fn_name: 'create_reflection',
        payload: reflection,
      });

      this.dispatchEvent(new CustomEvent('reflection-created', {
        composed: true,
        bubbles: true,
        detail: {
          reflectionHash: record.signed_action.hashed.hash
        }
      }));
      this._reflection = undefined;
      this._title = undefined;
      this.reflectionField.textAreaField.value = "";
      this.titleField.inputField.value = "";

    } catch (e: any) {
      const errorSnackbar = this.shadowRoot?.getElementById('create-error') as Snackbar;
      errorSnackbar.labelText = `Error creating the reflection: ${e.data.data}`;
      errorSnackbar.show();
    }
  }

  render() {
    return html`
      <mwc-snackbar id="create-error" leading>
      </mwc-snackbar>

      <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 20px;">

          <mvb-textfield
            id="title-field"
            style="
              --mvb-primary-color: #abb5d6;
              --mvb-secondary-color: #838ba4;
              --mvb-textfield-width: 825px;
              --mvb-textfield-height: 50px;
              --border-width: 2px;
              margin-bottom: 10px;
            "
            placeholder="Title"
            @input=${(e: CustomEvent) => {
              this._title = (e.target as any).value;
            }}
            title="Title for easy discovery of reflections"
            required
          ></mvb-textfield>
          <mvb-textarea
            id="reflection-field"
            style="
              --mvb-primary-color: #abb5d6;
              --mvb-secondary-color: #838ba4;
              --border-width: 1px;
              margin-bottom: 15px;
            "
            cols="59"
            placeholder="Reflection"
            width="780px"
            @input=${(e: CustomEvent) => {
              this._reflection = (e.target as any).value;
            }}
            title="Any"
            required
          ></mvb-textarea>

          <div
            class="row ${this.isReflectionValid() ? "icon" : "disabled"}"
            style="align-items: center; margin-top: 5px; ${this.isReflectionValid() ? "" : "opacity: 0.5;"}"
            @click=${() => this.isReflectionValid() ? this.createReflection() : undefined}
          >
            <img style="height: 26px;" src="send_icon.svg" />
            <span style="color: #abb5d6; margin-left: 5px; font-size: 23px;">Send</span>
          </div>

    </div>`;
  }

  static styles = [sharedStyles, css`
    .container {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      margin-top: 10px;
      margin-right: 12px;
      margin-bottom: 20px;
    }

    .disabled {
        background: transparent;
        border-radius: 10px;
        padding: 8px;
        cursor: pointer;
    }

    .icon {
      background: transparent;
      border-radius: 10px;
      padding: 8px;
      cursor: pointer;
    }

    .icon:hover {
      background: #abb5d638;
      border-radius: 10px;
      padding: 8px;
    }

  `];
}
