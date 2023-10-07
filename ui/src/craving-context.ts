import { css, html, LitElement, PropertyValues } from 'lit';
import { consume, ContextProvider } from '@lit-labs/context';
import { customElement, property, state } from 'lit/decorators.js';
import { StoreSubscriber } from 'lit-svelte-stores';
import { get } from '@holochain-open-dev/stores';
import { CellId } from '@holochain/client';

import { CondenserStore } from './condenser-store';
import { condenserContext, cravingStoreContext } from './contexts';

@customElement('craving-context')
export class CravingContext extends LitElement {
  @consume({ context: condenserContext, subscribe: true })
  @state()
  condenserStore!: CondenserStore;

  @property()
  cravingCellId!: CellId;

  _cravingStore = new StoreSubscriber(this, () =>
    this.condenserStore.cravingStore(this.cravingCellId),
  );

  _cravingProvider!: ContextProvider<typeof cravingStoreContext>;

  connectedCallback() {
    super.connectedCallback();

    const cravingStore = get(
      this.condenserStore.cravingStore(this.cravingCellId),
    );

    // console.log("@connectedCallback: cravingStore: ", cravingStore);

    this._cravingProvider = new ContextProvider(
      this,
      cravingStoreContext,
      cravingStore,
    );
  }

  updated(changedValues: PropertyValues) {
    super.updated(changedValues);

    if (changedValues.has('cravingCellId')) {
      this._cravingProvider.setValue(this._cravingStore.value!);
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
