import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { consume } from '@lit-labs/context';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import '@material/mwc-circular-progress';
import { DnaHashMap } from '@holochain-open-dev/utils';
import { DnaModifiers } from '@holochain/client';

import './lobby-detail';
import { CondenserStore } from '../condenser-store';
import { condenserContext } from '../contexts';
import { LobbyStore } from '../lobby-store';
import { ProfilesStore } from './profiles/profiles-store';

@customElement('list-lobbies')
export class ListLobbies extends LitElement {
  @consume({ context: condenserContext })
  _store!: CondenserStore;

  private _allLobbies = new StoreSubscriber(
    this,
    () => this._store.getAllLobbies(),
  );

  renderList(lobbies: DnaHashMap<[LobbyStore, ProfilesStore, DnaModifiers]>) {
    console.log("/// Rendering lobbies list: ", lobbies.values());
    console.log("/// this._store: ", this._store);
    console.log("/// lobbies.size: ", lobbies.size);
    console.log("/// lobbies.values(): ", lobbies.values());

    if (lobbies.size === 0) return html`<span style="color: #9098b3;">No lobbies found.</span>`;


    return html`
      <div style="display: flex; flex-direction: row; flex-wrap: wrap;">
        ${Array.from(lobbies.values())
          .sort(([store_a, _a, __a], [store_b, _b, __b]) => store_b.lobbyInfo!.signed_action.hashed.content.timestamp - store_a.lobbyInfo!.signed_action.hashed.content.timestamp)
          .map((store) =>
          html`<lobby-detail .store=${store}></lobby-detail>`
        )}
      </div>
    `;
  }

  render() {
    return this.renderList(this._allLobbies.value);
  }
}
