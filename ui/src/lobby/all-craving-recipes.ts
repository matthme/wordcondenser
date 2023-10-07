import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Record, AppAgentClient, CellId } from '@holochain/client';
import { consume } from '@lit-labs/context';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import '@material/mwc-circular-progress';
import { decodeEntry } from '@holochain-open-dev/utils';

import {
  clientContext,
  condenserContext,
  lobbyStoreContext,
} from '../contexts';
import { CondenserStore } from '../condenser-store';
import { LobbyStore } from '../lobby-store';
import { DnaRecipe, LobbyInfo } from '../types';

@customElement('all-craving-recipes')
export class AllCravingRecipes extends LitElement {
  @consume({ context: clientContext })
  client!: AppAgentClient;

  @consume({ context: condenserContext })
  _condenserStore!: CondenserStore;

  @property({ type: Object })
  lobbyCellId!: CellId;

  @consume({ context: lobbyStoreContext })
  _store!: LobbyStore;

  private _allCravingRecipes = new StoreSubscriber(
    this,
    () => this._store.allCravingRecipes,
  );

  async installCraving(recipe: DnaRecipe) {
    // console.log("RECIPE: ", recipe);
    try {
      // create cell clone for this craving
      const clonedCell = await this._condenserStore.joinCraving(recipe);

      this.dispatchEvent(
        new CustomEvent('craving-joined', {
          composed: true,
          bubbles: true,
          detail: {
            clonedCell,
          },
        }),
      );
    } catch (e: any) {
      console.log('ERROR: ', e);
    }
  }

  renderList(cravingRecipeRecords: Array<Record>) {
    if (cravingRecipeRecords.length === 0)
      return html`<span style="font-size: 24px;"
        >No craving recipes found for this group.</span
      >`;

    const cravingRecipes: DnaRecipe[] = cravingRecipeRecords.map(
      record => decodeEntry(record) as DnaRecipe,
    );

    return html`
      <div style="display: flex; flex-direction: column; margin: 8px;">
        ${cravingRecipes.map(
          recipe => html`
            <div
              class="column"
              style="padding: 20px; border: 1px solid black; border-radius: 12px;"
            >
              <div class="row" style="font-size: 18px; color: black;">
                <div>${recipe.title}</div>
                <button @click=${async () => this.installCraving(recipe)}>
                  Install
                </button>
              </div>
            </div>
          `,
        )}
      </div>
    `;
  }

  render() {
    switch (this._allCravingRecipes.value.status) {
      case 'pending':
        return html`loading...`;
      case 'error':
        return html`ERROR`;
      case 'complete':
        return html`
          <div>
            Secret words:
            <span style="background: grey; color: black; padding: 2px;"
              >${(decodeEntry(this._store.lobbyInfo!) as LobbyInfo)
                .network_seed}</span
            >
          </div>
          ${this.renderList(this._allCravingRecipes.value.value)}
        `;
      default:
        return html`Invalid AsyncReadable state`;
    }
  }
}
