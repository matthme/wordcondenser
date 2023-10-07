import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit-labs/context';
import { StoreSubscriber } from '@holochain-open-dev/stores';

import './craving-detail';
import { DnaHash } from '@holochain/client';
import { CondenserStore, LobbyData } from '../condenser-store';
import { condenserContext } from '../contexts';
import { sharedStyles } from '../sharedStyles';
import { DnaRecipe } from '../types';

@customElement('all-available-cravings')
export class AllAvailableCravings extends LitElement {
  @consume({ context: condenserContext })
  _store!: CondenserStore;

  private _allAvailableCravings = new StoreSubscriber(this, () =>
    this._store.getAvailableCravings(),
  );

  @state()
  installing: boolean = false;

  @state()
  installingDnaHash: DnaHash | undefined;

  async joinCraving(dnaRecipe: DnaRecipe) {
    this.installing = true;
    this.installingDnaHash = dnaRecipe.resulting_dna_hash;
    try {
      const clonedCell = await this._store.joinCraving(dnaRecipe);

      // console.log("@all-available-cravings: @joinCraving: Created craving cell with hash: ", encodeHashToBase64(clonedCell.cell_id[0]));
      this.dispatchEvent(
        new CustomEvent('installed-craving', {
          detail: {
            craving: dnaRecipe.properties,
            cellId: clonedCell.cell_id,
          },
          bubbles: true,
          composed: true,
        }),
      );

      window.location.reload();
      this.installing = false;
      this.installingDnaHash = undefined;
    } catch (e) {
      alert('Failed to install Craving. See console for details');
      this.installing = false;
      this.installingDnaHash = undefined;
      throw new Error(`Failed to install Craving: ${JSON.stringify(e)}`);
    }
  }

  renderList(availableCravings: Array<[DnaHash, [DnaRecipe, LobbyData[]]]>) {
    if (Object.values(availableCravings).length === 0)
      return html` <div
        class="column"
        style="justify-content: center; align-items: center; flex: 1;"
      >
        <div
          style="color: #929ab9; margin-left: 20px; margin-top: 30px; font-size: 0.9em;"
        >
          No available cravings found that you did not already join.
        </div>
      </div>`;

    return html`
      <div style="display: flex; flex-direction: row; flex-wrap: wrap;">
        ${availableCravings
          .sort(
            (
              [_dnaHash_a, [dnaRecipe_a, _lobbyDatas_a]],
              [_dnaHash_b, [dnaRecipe_b, _lobbyDatas_b]],
            ) => dnaRecipe_a.title.localeCompare(dnaRecipe_b.title),
          )
          .map(
            ([_dnaHash, [dnaRecipe, lobbyDatas]]) => html`
              <div
                class="craving-container"
                style="display: flex; flex-direction: column"
                tabindex="0"
              >
                <div class="column" style="align-items: flex-end; width: 100%;">
                  <div
                    class="row"
                    style="margin-top: 5px; justify-content: flex-end; overflow-x: auto;"
                  >
                    ${lobbyDatas.map(lobbyData => {
                      if (lobbyData.info?.logo_src) {
                        return html`<img
                          alt="Group logo"
                          title=${lobbyData.name}
                          src=${lobbyData.info.logo_src}
                          style="height: 50px; width: 50px; border-radius: 50%; margin: 5px 2px 5px 2px;"
                        />`;
                      }
                      return html``;
                    })}
                  </div>
                </div>

                <div class="craving-title" style="margin-bottom: auto;">
                  ${dnaRecipe.title}
                </div>

                <!-- <div
                class="button-bar row"
                style="height: 60px; cursor: pointer; justify-content: center;"
                title="Install Craving"
                tabindex="0"
              >Install</div> -->
                <div
                  class="column"
                  style="align-items: flex-end; width: 100%; margin: 5px 0; margin-right: -15px;"
                >
                  <div
                    class="row confirm-btn"
                    style="align-items: center;"
                    @click=${async () => this.joinCraving(dnaRecipe)}
                    @keypress=${async () => this.joinCraving(dnaRecipe)}
                    tabindex="0"
                  >
                    <span
                      style="color: black; font-size: 23px; font-weight: 600; ${this
                        .installing
                        ? 'opacity: 0.6'
                        : ''}"
                    >
                      ${this.installing &&
                      dnaRecipe.resulting_dna_hash === this.installingDnaHash
                        ? 'installing...'
                        : 'Join'}
                    </span>
                  </div>
                </div>
              </div>
            `,
          )}
      </div>
    `;
  }

  render() {
    return this.renderList(this._allAvailableCravings.value);
  }

  static styles = [
    sharedStyles,
    css`
      .craving-container {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        width: 380px;
        height: 260px;
        margin: 10px;
        background: #818cae;
        border-radius: 10px;
        box-shadow: 2px 2px 4px 3px #1e253d;
        padding: 15px 15px 10px 30px;
      }

      .craving-title {
        font-weight: bold;
        font-size: 28px;
        text-align: left;
        color: #0b0d15;
      }

      .confirm-btn {
        background: #c8cfe637;
        border-radius: 10px;
        padding: 8px 15px;
        cursor: pointer;
      }

      .confirm-btn:hover {
        background: #c8cfe68a;
        border-radius: 10px;
        padding: 8px 15px;
      }
    `,
  ];
}
