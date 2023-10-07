import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { consume } from '@lit-labs/context';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import '@material/mwc-circular-progress';
import { DnaHashMap } from '@holochain-open-dev/utils';
import { ClonedCell, DnaModifiers } from '@holochain/client';

import './lobby-detail';
import './disabled-lobby-detail';
import { CondenserStore } from '../condenser-store';
import { condenserContext } from '../contexts';
import { LobbyStore } from '../lobby-store';
import { ProfilesStore } from './profiles/profiles-store';

@customElement('all-lobbies')
export class AllLobbies extends LitElement {
  @consume({ context: condenserContext })
  _store!: CondenserStore;

  private _allLobbies = new StoreSubscriber(this, () =>
    this._store.getAllLobbies(),
  );

  private _disabledLobbies = new StoreSubscriber(this, () =>
    this._store.getDisabledLobbies(),
  );

  renderList(
    lobbies: DnaHashMap<[LobbyStore, ProfilesStore, DnaModifiers]>,
    disabledLobbies: Record<string, ClonedCell>,
  ) {
    if (lobbies.size === 0 && Object.values(disabledLobbies).length === 0)
      return html`<span style="color: #9098b3;">No lobbies found.</span>`;

    return html`
      <div style="display: flex; flex-direction: column; flex-wrap: wrap;">
        ${Array.from(lobbies.values())
          .sort(([store_a, _a, __a], [store_b, _b, __b]) =>
            store_a.lobbyName.localeCompare(store_b.lobbyName),
          )
          .map(
            ([lobbyStore, _profilesStore, _dnaModifiers]) =>
              html`<lobby-detail .store=${lobbyStore}></lobby-detail>`,
          )}

        <div
          style="color: #9098b3; margin-top: 80px; margin-bottom: 30px; ${Object.values(
            disabledLobbies,
          ).length === 0
            ? 'display: none;'
            : ''}"
        >
          Disabled Groups:
        </div>
        ${Object.entries(disabledLobbies)
          .sort(([name_a, _a], [name_b, _b]) => name_a.localeCompare(name_b))
          .map(
            ([name, cloneInfo]) =>
              html`<disabled-lobby-detail
                .name=${name}
                .cloneInfo=${cloneInfo}
              ></disabled-lobby-detail>`,
          )}
      </div>
      <div style="margin-bottom: 50px;"></div>
    `;
  }

  render() {
    return this.renderList(this._allLobbies.value, this._disabledLobbies.value);
  }
}
