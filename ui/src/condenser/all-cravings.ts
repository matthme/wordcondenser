import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { consume } from '@lit-labs/context';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import '@material/mwc-circular-progress';
import { EntryRecord } from '@holochain-open-dev/utils';

import './craving-detail';
import { CondenserStore } from '../condenser-store';
import { condenserContext } from '../contexts';
import { Craving } from './types';

@customElement('all-cravings')
export class AllCravings extends LitElement {
  @consume({ context: condenserContext })
  _store!: CondenserStore;

  private _allCravings = new StoreSubscriber(
    this,
    () => this._store.allCravings,
  );

  renderList(cravings: EntryRecord<Craving>[]) {
    if (cravings.length === 0)
      return html` <div
        class="column"
        style="justify-content: center; align-items: center; flex: 1;"
      >
        <div
          style="color: #929ab9; margin-left: 20px; margin-top: 30px; font-size: 0.9em;"
        >
          No cravings found.
        </div>
      </div>`;

    return html`
      <div style="display: flex; flex-direction: row; flex-wrap: wrap;">
        ${Array.from(cravings.values())
          .sort(
            (craving_a, craving_b) =>
              craving_b.action.timestamp - craving_a.action.timestamp,
          )
          .map(
            craving =>
              html`<craving-detail
                .store=${this._store.cravingStore(craving.actionHash)}
              ></craving-detail>`,
          )}
      </div>
    `;
  }

  render() {
    switch (this._allCravings.value.status) {
      case 'pending':
        return html`loading...`;
      case 'error':
        console.error(
          'Failed to load cravings: ',
          this._allCravings.value.error,
        );
        return html`Failed to load cravings.`;
      case 'complete':
        return this.renderList(this._allCravings.value.value);
      default:
        return html`unexpected store status.`;
    }
  }
}
