import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { consume } from '@lit-labs/context';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import '@material/mwc-circular-progress';
import { DnaHashMap } from '@holochain-open-dev/utils';

import './craving-detail';
import { CondenserStore } from '../condenser-store';
import { CravingStore } from '../craving-store';
import { condenserContext } from '../contexts';

@customElement('all-cravings')
export class AllCravings extends LitElement {
  @consume({ context: condenserContext })
  _store!: CondenserStore;

  private _allCravings = new StoreSubscriber(
    this,
    () => this._store.getAllInstalledCravings(),
  );

  renderList(cravings: DnaHashMap<CravingStore>) {
    // console.log("/// Rendering cravings list: ", cravings.values());
    // console.log("/// this._store: ", this._store);
    // console.log("/// carvings.size: ", cravings.size);
    // console.log("/// carvings.values(): ", cravings.values());

    if (cravings.size === 0) return html`
      <div class="column" style="justify-content: center; align-items: center; flex: 1;">
        <div style="color: #929ab9; margin-left: 20px; margin-top: 30px; font-size: 0.9em;">No cravings found.</div>
      </div>`;


    return html`
      <div style="display: flex; flex-direction: row; flex-wrap: wrap;">
        ${Array.from(cravings.values())
          .sort((store_a, store_b) => store_b.initTime - store_a.initTime)
          .map((store) =>
          html`<craving-detail .store=${store}></craving-detail>`
        )}
      </div>
    `;
  }

  render() {
    return this.renderList(this._allCravings.value);
  }
}
