import { LitElement, html, css } from 'lit';
import { state, customElement, property } from 'lit/decorators.js';
import { consume } from '@lit-labs/context';
import { Record } from '@holochain/client';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';

import '@material/mwc-circular-progress';
import '@material/mwc-icon-button';
import '@material/mwc-snackbar';

import { decodeEntry } from '@holochain-open-dev/utils';
import { LobbyStore } from '../lobby-store';
import { LobbyInfo } from '../types';
import { sharedStyles } from '../sharedStyles';
import { condenserContext } from '../contexts';
import { CondenserStore } from '../condenser-store';

TimeAgo.addDefaultLocale(en);
const timeAgo = new TimeAgo('en-US')

@customElement('lobby-detail')
export class LobbyDetail extends LitElement {

  @consume({ context: condenserContext, subscribe: true })
  condenserStore!: CondenserStore;

  @property()
  store!: LobbyStore;

  @state()
  _editing = false;

  renderDetail(record: Record | undefined) {

    const lobbyInfo = record ? decodeEntry(record) as LobbyInfo : undefined;

    return html`
      <mwc-snackbar id="delete-error" leading> </mwc-snackbar>

      <div
        class=${!!lobbyInfo ? "lobby-container" : "lobby-container-disabled"}
        style="display: flex; flex-direction: column; flex: 1;"
        tabindex="0"
        @keypress=${(e: KeyboardEvent) => (e.key === "Enter") ? this.dispatchEvent(new CustomEvent("selected-lobby", {
          detail: {
            cellId: this.store.service.cellId,
            lobbyInfo,
          },
          bubbles: true,
          composed: true,
        })) : undefined
      }
        @click=${() => this.dispatchEvent(new CustomEvent("selected-lobby", {
          detail: {
            cellId: this.store.service.cellId,
            lobbyInfo,
          },
          bubbles: true,
          composed: true,
        }))
      }
      >
        <div class="row" style="align-items: center; flex: 1; width: 100%;">
          ${
            lobbyInfo
              ? html`<img src=${lobbyInfo.logo_src} style="height: 80px; width: 80px; border-radius: 20px;" />`
              : html`
                <div
                  class="column"
                  style="
                    height: 80px;
                    width: 80px;
                    border-radius: 20px;
                    background: #929ab9;
                    color: black;
                    font-size: 40px;
                    font-weight: bold;
                    justify-content: center;
                    align-items: center;
                  "
                  title="Could not get Group Meta data from Peers yet. Maybe no one is online at the moment."
                >
                  ${this.store.lobbyName.slice(0,2)}
                </div>
                `
          }

          <div class="lobby-title" style="margin-left: 15px;">${this.store.lobbyName}</div>
          ${ lobbyInfo ? html`` : html `


            <img
              @click=${async () => {
                await this.condenserStore.fetchStores()
                this.requestUpdate();
                }
              }
              @keypress=${async () => {
                await this.condenserStore.fetchStores()
                this.requestUpdate();
                }
              }
              src="clock.svg"
              style="height: 60px; opacity: 0.8; margin-left: auto;"
              alt="clock icon, depicting that Group meta data could not yet be fetched from other peers"
              title="Waiting to get group meta data. At least one other peer needs to be online for this. To refresh, click the refresh button in the lower left corner of the screen."
            />`
            }
        </div>

      </div>
    `;
  }


  render() {
    return this.renderDetail(this.store.lobbyInfo);
  }

  static styles = [sharedStyles, css`
    .lobby-container {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      width: 950px;
      margin: 10px;
      background: #818cae;
      border-radius: 20px;
      box-shadow: 2px 2px 4px 3px #1e253d;
      padding: 20px;
      cursor: pointer;
    }

    .lobby-container:hover {
      background: #9098b3;
    }

    .lobby-container-disabled {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      width: 950px;
      margin: 10px;
      background: #818caea7;
      border-radius: 20px;
      box-shadow: 2px 2px 4px 3px #1e253d;
      padding: 20px;
      cursor: pointer;
    }

    .lobby-container-disabled:hover {
      background: #818caec8;
    }

    .lobby-title {
      white-space: pre-line;
      font-weight: bold;
      font-size: 28px;
      text-align: left;
      color: #0b0d15;
    }

    .lobby-description {
      white-space: pre-line;
      text-align: left;
      font-size: 19px;
      overflow-y: auto;
      margin-top: 10px;
      color: #0b0d15;
    }
  `];
}
