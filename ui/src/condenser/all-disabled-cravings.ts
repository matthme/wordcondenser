import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { consume } from '@lit-labs/context';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import { CellId, ClonedCell } from '@holochain/client';

import { CondenserStore } from '../condenser-store';
import { condenserContext } from '../contexts';
import { sharedStyles } from '../sharedStyles';
import './craving-detail';

@customElement('all-disabled-cravings')
export class AllDisabledCravings extends LitElement {
  @consume({ context: condenserContext })
  _store!: CondenserStore;

  private _allDisabledCravings = new StoreSubscriber(this, () =>
    this._store.getAllDisabledCravings(),
  );

  async enableCraving(cellId: CellId) {
    try {
      await this._store.enableCraving(cellId);
      window.location.reload();
    } catch (e) {
      alert('Failed to enable Craving. See console for details');
      throw new Error(`Failed to enable Craving: ${JSON.stringify(e)}`);
    }
  }

  renderList(cravings: Record<string, ClonedCell>) {
    if (Object.values(cravings).length === 0)
      return html` <div
        class="column"
        style="justify-content: center; align-items: center; flex: 1;"
      >
        <div
          style="color: #929ab9; margin-left: 20px; margin-top: 30px; font-size: 0.9em;"
        >
          No disabled cravings found.
        </div>
      </div>`;

    return html`
      <div style="display: flex; flex-direction: row; flex-wrap: wrap;">
        ${Object.entries(cravings)
          .sort(([cloneName_a, _cloneInfo_a], [cloneName_b, _cloneInfo_b]) =>
            cloneName_a.localeCompare(cloneName_b),
          )
          .map(
            ([cloneName, cloneInfo]) =>
              html`

            <div
              class="craving-container"
              style="display: flex; flex-direction: column"
              tabindex="0"
            >
              <div class="craving-title">${cloneName}</div>
              <img
                class="icon"
                src="power_on.svg"
                alt="Poer ON icon to enable Craving"
                style="height: 60px; position: absolute; bottom: 5px; right: 5px; cursor: pointer;"
                title="Enable Craving"
                tabindex="0"
                @click=${async () => this.enableCraving(cloneInfo.cell_id)}
                @keypress=${async () => this.enableCraving(cloneInfo.cell_id)}
              />
            </div>

            </div>

          `,
          )}
      </div>
    `;
  }

  render() {
    return this.renderList(this._allDisabledCravings.value);
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
        height: 160px;
        margin: 10px;
        background: #818cae;
        border-radius: 10px;
        box-shadow: 2px 2px 4px 3px #1e253d;
        padding: 18px 30px 3px 30px;
      }

      .craving-title {
        white-space: pre-line;
        font-weight: bold;
        font-size: 28px;
        text-align: left;
        color: #0b0d15;
      }

      .icon {
        background: transparent;
        border-radius: 20px;
        padding: 8px;
      }
    `,
  ];
}
