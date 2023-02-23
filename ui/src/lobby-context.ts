import { css, html, LitElement, PropertyValues } from "lit";
import {
  consume,
  ContextProvider,
} from "@lit-labs/context";
import { customElement, property, state } from "lit/decorators.js";
import { StoreSubscriber } from "lit-svelte-stores";

import { CondenserStore } from "./condenser-store";
import { CellId } from "@holochain/client";
import { condenserContext, lobbyStoreContext } from "./contexts";
import { get } from "@holochain-open-dev/stores";


@customElement('lobby-context')
export class LobbyContext extends LitElement {
  @consume({ context: condenserContext, subscribe: true })
  @state()
  condenserStore!: CondenserStore;

  @property()
  lobbyCellId!: CellId;


  _lobbyStore = new StoreSubscriber(this, () => this.condenserStore.lobbyStoreReadable(this.lobbyCellId));

  _lobbyProvider!: ContextProvider<typeof lobbyStoreContext>;


  connectedCallback() {
    super.connectedCallback();

    const [lobbyStore, profilesStore, dnaModifiers] = get(this.condenserStore.lobbyStoreReadable(this.lobbyCellId));

    console.log("@connectedCallback: cravingStore: ", lobbyStore);

    this._lobbyProvider = new ContextProvider(
      this,
      lobbyStoreContext,
      lobbyStore,
    );
  }

  updated(changedValues: PropertyValues) {
    super.updated(changedValues);

    if (changedValues.has("lobbyCellId")) {
      this._lobbyProvider.setValue(this._lobbyStore.value![0]);
    }
  }

  render() {
    return html`<slot></slot>`;
  }

  static styles = css`
    :host {
      display: contents;
    }
  `;
}
