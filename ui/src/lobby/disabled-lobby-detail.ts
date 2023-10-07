import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ClonedCell } from '@holochain/client';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import { consume } from '@lit-labs/context';

import '@material/mwc-circular-progress';
import '@material/mwc-icon-button';
import '@material/mwc-snackbar';

import { sharedStyles } from '../sharedStyles';
import { condenserContext } from '../contexts';
import { CondenserStore } from '../condenser-store';

TimeAgo.addDefaultLocale(en);
const timeAgo = new TimeAgo('en-US');

@customElement('disabled-lobby-detail')
export class DisabledLobbyDetail extends LitElement {
  @consume({ context: condenserContext })
  _condenserStore!: CondenserStore;

  @property()
  name!: string;

  @property()
  cloneInfo!: ClonedCell;

  async enableLobby() {
    try {
      await this._condenserStore.enableLobby(this.cloneInfo.cell_id);
      window.location.reload();
    } catch (e) {
      console.log('Failed to enable group: ', e);
      alert('failed to enable group. See console for details.');
    }
  }

  render() {
    return html`
      <div
        class="lobby-container"
        style="display: flex; flex-direction: column; flex: 1;"
        tabindex="0"
      >
        <div class="row" style="align-items: center; width: 100%;">
          <div class="lobby-title" style="margin-left: 15px;">${this.name}</div>
          <div style="display: flex; flex: 1; margin: auto;"></div>

          <img
            src="play_button.svg"
            alt="Play icon"
            class="icon"
            style="height: 60px; width: 60px; cursor: pointer; margin-right: 3px;"
            title="Enable"
            @keypress=${async (e: KeyboardEvent) => {
              if (e.key === 'Enter') {
                await this.enableLobby();
              }
            }}
            @click=${async () => this.enableLobby()}
          />
        </div>
      </div>
    `;
  }

  static styles = [
    sharedStyles,
    css`
      .lobby-container {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        width: 950px;
        margin: 10px;
        background: #818cae9f;
        border-radius: 20px;
        box-shadow: 2px 2px 4px 3px #1e253d;
        padding: 20px;
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

      .icon {
        background: transparent;
        border-radius: 50%;
        padding: 8px;
      }

      .icon:hover {
        background: #abb5d638;
        border-radius: 50%;
        padding: 8px;
      }
    `,
  ];
}
