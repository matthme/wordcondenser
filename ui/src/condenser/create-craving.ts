import { LitElement, html, css } from 'lit';
import { state, customElement } from 'lit/decorators.js';
import { AppClient } from '@holochain/client';
import { consume } from '@lit-labs/context';
import '@material/mwc-button';
import '@material/mwc-snackbar';
import { Snackbar } from '@material/mwc-snackbar';

import '@material/mwc-textfield';
import '@material/mwc-textarea';
import '../components/mvb-textfield';
import '../components/mvb-textarea';
import '../components/mvb-button';
import { sharedStyles } from '../sharedStyles';
import { CondenserStore } from '../condenser-store';
import { clientContext, condenserContext } from '../contexts';
import { Craving } from './types';
import { MVBButton } from '../components/mvb-button';

const MAX_DESCRIPTION_CHARS = 10000;
const MAX_TITLE_CHARS = 80;

@customElement('create-craving')
export class CreateCraving extends LitElement {
  @consume({ context: clientContext })
  client!: AppClient;

  @consume({ context: condenserContext })
  store!: CondenserStore;

  @state()
  _title: string | undefined;

  @state()
  _description: string | undefined;

  @state()
  _max_association_chars: number | undefined;

  @state()
  _max_offer_chars: number | undefined;

  @state()
  _max_reflection_chars: number | undefined;

  @state()
  installing: boolean = false;

  @state()
  onFire: boolean = false;

  isCravingValid() {
    return (
      this._title !== undefined &&
      this._title !== '' &&
      this._title.length <= MAX_TITLE_CHARS &&
      this._description !== undefined &&
      this._description !== '' &&
      this._description.length <= MAX_DESCRIPTION_CHARS
    );
  }

  titleTooLong() {
    return this._title ? this._title.length > MAX_TITLE_CHARS : false;
  }

  descriptionTooLong() {
    return this._description
      ? this._description.length > MAX_DESCRIPTION_CHARS
      : false;
  }

  async createCraving() {
    this.installing = true;
    (
      this.shadowRoot?.getElementById('create-craving-button') as MVBButton
    ).disabled = true;

    // !! IMPORTANT !! Order of attributes matter in order to get the same DNA hash
    const craving: Craving = {
      title: this._title!,
      description: this._description!,
      max_anecdote_chars: undefined,
      max_association_chars: this._max_association_chars,
      max_offer_chars: this._max_offer_chars,
      max_reflection_chars: this._max_reflection_chars,
    };

    try {
      // create cell clone for this craving
      const entryRecord = await this.store.createCraving(craving);

      this.dispatchEvent(
        new CustomEvent('craving-created', {
          composed: true,
          bubbles: true,
          detail: {
            craving: entryRecord,
          },
        }),
      );
      this.installing = false;
      (
        this.shadowRoot?.getElementById('create-craving-button') as MVBButton
      ).disabled = true;
    } catch (e: any) {
      console.log('Error creating the craving: ', e);
      const errorSnackbar = this.shadowRoot?.getElementById(
        'create-error',
      ) as Snackbar;
      errorSnackbar.labelText = `Error creating the craving: ${e}`;
      errorSnackbar.show();

      this.installing = false;
      (
        this.shadowRoot?.getElementById('create-craving-button') as MVBButton
      ).disabled = false;
    }
  }

  render() {
    return html`
      <mwc-snackbar id="create-error" leading> </mwc-snackbar>

      <div class="column" style="align-items: center;">
        <div class="box">
          <div
            style="font-size: 40px; font-weight: bold; color: #abb5da; opacity: 0.85; margin-bottom: 30px; margin-top: 40px;"
          >
            Add New Craving
          </div>

          <div style="margin-bottom: 15px;">
            <mvb-textfield
              style="
                --mvb-primary-color: #abb5d6;
                --mvb-secondary-color: #838ba4;
                --mvb-textfield-width: 800px;
                --mvb-textfield-height: 56px;
                margin-bottom: 15px;
              "
              placeholder="Title"
              @input=${(e: CustomEvent) => {
                this._title = (e.target as any).value;
              }}
              title="Give your craving a title"
            >
            </mvb-textfield>
          </div>

          <div style="margin-bottom: 15px;">
            <mvb-textarea
              style="
                --mvb-primary-color: #abb5d6;
                --mvb-secondary-color: #838ba4;
                margin-bottom: 30px;
              "
              @input=${(e: CustomEvent) => {
                this._description = (e.target as any).value;
              }}
              placeholder="Describe here what it is that you vaguely see - and are craving for part of our language to be..."
              title="Describe what it is that you want a word or expression for"
              cols="57"
              rows="13"
              width="760px"
              required
            ></mvb-textarea>
          </div>

          ${this.titleTooLong()
            ? html`<div
                style="font-size: 19px; line-height: 30px; color: #ba3030; margin: 5px; max-width: 800px; text-align: left;"
              >
                Title is too long. Must be no more than ${MAX_TITLE_CHARS}
                characters.
              </div> `
            : html``}
          ${this.descriptionTooLong()
            ? html`<div
                style="font-size: 19px; line-height: 30px; color: #ba3030; margin: 5px; max-width: 800px; text-align: left;"
              >
                Description is too long. Must be no more than
                ${MAX_DESCRIPTION_CHARS} characters.
              </div> `
            : html``}

          <div style="margin-bottom: 10px;">
            <mvb-button
              id="create-craving-button"
              style="
                --mvb-primary-color: none;
                --mvb-secondary-color: #ffd7230e;
                --mvb-button-text-color: #ffd623ff;
                --mvb-button-disabled-text-color: #ffd72360;
                opacity: 0.85;
              "
              @click=${() => this.createCraving()}
              .disabled=${!this.isCravingValid() && !this.installing}
            >
              <div class="row" style="align-items: center;">
                <img
                  src="empty_glass.svg"
                  alt="Icon of an empty Erlenmeyer flask"
                  style="height: 50px;"
                />
                <span style="margin-left: 12px;"
                  >${this.installing ? 'creating...' : 'Create Craving'}</span
                >
              </div>
            </mvb-button>
          </div>
        </div>
      </div>
    `;
  }

  static styles = [
    sharedStyles,
    css`
      .red {
        color: #ff5630;
      }

      .box {
        /* border: 2px solid #ffc64c94; */
        border-radius: 25px;
        margin: 10px;
        padding: 10px 70px;
        background: #fff6e309;
        max-width: 800px;
      }

      .group-selection-element {
        display: flex;
        flex-direction: row;
        align-items: center;
        font-size: 19px;
        color: #98a3cf;
        min-height: 90px;
        background: #c5cded09;
        border-radius: 12px;
        border: 1px solid transparent;
        margin: 6px;
        cursor: pointer;
      }

      .group-selection-element:hover {
        background: #c5cded38;
      }

      .selected {
        background: #c5cded38;
        border: 1px solid #c5cded;
      }
    `,
  ];
}
