import { css, html, LitElement, PropertyValues } from 'lit';
import { consume, ContextProvider } from '@lit-labs/context';
import { customElement, property, state } from 'lit/decorators.js';
import { StoreSubscriber } from 'lit-svelte-stores';
import { get } from '@holochain-open-dev/stores';
import { ActionHash, CellId } from '@holochain/client';

import { CondenserStore } from './condenser-store';
import { condenserContext, cravingStoreContext } from './contexts';
import { CravingStore } from './craving-store';

@customElement('craving-context')
export class CravingContext extends LitElement {
  @consume({ context: condenserContext, subscribe: true })
  @state()
  condenserStore!: CondenserStore;

  @property()
  cravingStore!: CravingStore;

  // _cravingStore = new StoreSubscriber(this, () =>
  //   this.condenserStore.cravingStore(this.cravingHash),
  // );

  _cravingProvider!: ContextProvider<typeof cravingStoreContext>;

  connectedCallback() {
    super.connectedCallback();

    // const cravingStore = get(
    //   this.condenserStore.cravingStore(this.cravingCellId),
    // );

    // console.log("@connectedCallback: cravingStore: ", cravingStore);

    this._cravingProvider = new ContextProvider(
      this,
      cravingStoreContext,
      this.cravingStore,
    );
  }

  updated(changedValues: PropertyValues) {
    super.updated(changedValues);

    if (changedValues.has('cravingHash')) {
      this._cravingProvider.setValue(this.cravingStore);
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
