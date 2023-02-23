import { LitElement, html, css } from 'lit';
import { state, customElement, property } from 'lit/decorators.js';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';

import '@material/mwc-circular-progress';
import '@material/mwc-icon-button';
import '@material/mwc-snackbar';

import { condenserContext } from '../contexts';
import { CravingStore } from '../craving-store';
import { consume } from '@lit-labs/context';
import { CondenserStore } from '../condenser-store';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import { sharedStyles } from '../sharedStyles';

TimeAgo.addDefaultLocale(en);
const timeAgo = new TimeAgo('en-US')

@customElement('craving-detail')
export class CravingDetail extends LitElement {
  @consume({ context: condenserContext })
  condenserStore!: CondenserStore;
  // @consume({ context: cravingStoreContext })
  @property()
  store!: CravingStore;

  @state()
  _editing = false;

  private _lobbiesForCraving = new StoreSubscriber(
    this,
    () => this.condenserStore.getLobbiesForCraving(this.store.service.cellId[0]),
  );

  render() {
    const timestamp = this.store.initTime
    const craving = this.store.craving;
    const date = new Date(timestamp);

    // console.log("Craving: ", craving);

    return html`
      <mwc-snackbar id="delete-error" leading> </mwc-snackbar>

      <div
        class="craving-container"
        style="display: flex; flex-direction: column"
        tabindex="0"
        @keypress.enter=${() => this.dispatchEvent(new CustomEvent("selected-craving", {
          detail: {
            cellId: this.store.service.cellId,
            craving,
          },
          bubbles: true,
          composed: true,
        }))}
        @click=${() => this.dispatchEvent(new CustomEvent("selected-craving", {
          detail: {
            cellId: this.store.service.cellId,
            craving,
          },
          bubbles: true,
          composed: true,
        }))}
      >
        <div class="row" style="text-align: right; font-size: 14px; color: black; width: 100%; margin-bottom: 10px;">
          <span style="display: flex; flex: 1;"></span>
          <span>installed ${timeAgo.format(date)}</span>
        </div>
        <div class="craving-title">${craving.title}</div>
        <div class="craving-description">${craving.description}</div>

        <div class="column" style="flex: 1; align-items: flex-end; width: 100%;">
          <div class="row" style="margin-top: 5px; justify-content: flex-end; margin-right: -15px; overflow-x: auto;">
            ${
              this._lobbiesForCraving.value.map((lobbyData) => {
                if (lobbyData.info?.logo_src) {
                  return html`<img title=${lobbyData.name} src=${lobbyData.info.logo_src} style="height: 50px; width: 50px; border-radius: 50%; margin: 5px 2px 12px 2px;" />`
                }
            })
            }
          </div>
        </div>

      </div>
    `;
  }



  static styles = [sharedStyles,
    css`
    .craving-container {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      width: 380px;
      height: 260px;
      margin: 10px;
      background: #818cae;
      border-radius: 10px;
      box-shadow: 2px 2px 4px 3px #1e253d;
      padding: 18px 30px 3px 30px;
      cursor: pointer;
    }

    .craving-container:hover {
      background: #9098b3;
    }

    .craving-title {
      white-space: pre-line;
      font-weight: bold;
      font-size: 28px;
      text-align: left;
      color: #0b0d15;
    }

    .craving-description {
      white-space: normal;
      text-align: left;
      font-size: 19px;
      height: 120px;
      overflow-y: auto;
      margin-top: 10px;
      color: #0b0d15;
    }
  `];
}
