import { LitElement, html, css } from 'lit';
import { state, customElement, property } from 'lit/decorators.js';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';

import '@material/mwc-circular-progress';
import '@material/mwc-icon-button';
import '@material/mwc-snackbar';

import { condenserContext } from '../contexts';
import { CravingStore } from '../craving-store';
import { consume } from '@lit-labs/context';
import { CondenserStore } from '../condenser-store';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import { sharedStyles } from '../sharedStyles';
import { newAssociationsCount, newOffersCount, newCommentsCount, newReflectionsCount } from '../utils';

TimeAgo.addDefaultLocale(en);
const timeAgo = new TimeAgo('en-US')

@customElement('craving-detail')
export class CravingDetail extends LitElement {
  @consume({ context: condenserContext })
  condenserStore!: CondenserStore;
  // @consume({ context: cravingStoreContext })
  @property()
  store!: CravingStore;

  @state()
  _editing = false;

  private _lobbiesForCraving = new StoreSubscriber(
    this,
    () => this.condenserStore.getLobbiesForCraving(this.store.service.cellId[0]),
  );

  private _allReflections = new StoreSubscriber(
    this,
    () => this.store.allReflections
  );

  private _allCommentCount = new StoreSubscriber(
    this,
    () => this.store.allCommentsCount
  )

  private _allOffers = new StoreSubscriber(
    this,
    () => this.store.polledOffers
  );

  private _allAssociations = new StoreSubscriber(
    this,
    () => this.store.polledAssociations
  );

  // [number of total associations total, number of new associations]
  associationsCount(): [string, string | undefined] {
    switch (this._allAssociations.value.status) {
      case "pending":
        return ["?", undefined];
      case "error":
        return ["?", undefined];
      case "complete": {
        const currentCount = this._allAssociations.value.value.length;
        const newCount = newAssociationsCount(this.store.service.cellId[0], currentCount);
        return [currentCount.toString(), newCount ? newCount.toString() : undefined];
      }
    }
  }

  reflectionCount(): [string, string | undefined] {
    switch (this._allReflections.value.status) {
      case "pending":
        return ["?", undefined];
      case "error":
        return ["?", undefined];
      case "complete":
        const currentCount = this._allReflections.value.value.length;
        const newCount = newReflectionsCount(this.store.service.cellId[0], currentCount);
        // console.log("currentCount, newCount: ", currentCount, newCount);
        return [currentCount.toString(), newCount ? newCount.toString() : undefined];
    }
  }

  commentsCount(): string | undefined {
    switch (this._allCommentCount.value.status) {
      case "pending":
        return undefined;
      case "error":
        return undefined;
      case "complete":
        const currentCount = this._allCommentCount.value.value;
        const newCount = newCommentsCount(this.store.service.cellId[0], currentCount);
        console.log("newCount: ", newCount);
        return newCount ? newCount.toString() : undefined;
    }
  }

  offersCount(): [string, string | undefined] {
    switch (this._allOffers.value.status) {
      case "pending":
        return ["?", undefined];
      case "error":
        return ["?", undefined];
      case "complete": {
        const currentCount = this._allOffers.value.value.length;
        const newCount = newOffersCount(this.store.service.cellId[0], currentCount);
        return [currentCount.toString(), newCount ? newCount.toString() : undefined];
      }
    }
  }

  renderCounts() {
    return html`
      <div class="row" stye="align-items: center;">
        <span style="font-size: 19px; margin-right: 4px;" title="${this.associationsCount()} associations">${this.associationsCount()[0]} ${this.associationsCount()[1] ? `(+${this.associationsCount()[1]})` : ""}</span>
        <img src="associations.png" style="height: 30px; margin-right: 6px;" title="${this.associationsCount()} associations"/>
        <span style="font-size: 19px; margin-right: 4px;" title="${this.reflectionCount()} reflections">${this.reflectionCount()[0]} ${this.reflectionCount()[1] ? `(+${this.reflectionCount()[1]})` : ""}</span>
        <img src="reflections_black.svg" style="height: 30px; margin-right: 6px;" title="${this.reflectionCount()} reflections"/>
        <span style="font-size: 19px; margin-right: 4px;" title="${this.offersCount()} offers">${this.offersCount()[0]} ${this.offersCount()[1] ? `(+${this.offersCount()[1]})` : ""}</span>
        <img src="offers.svg" style="height: 30px;" title="${this.offersCount()} offers"/>
      </div>
    `
  }


  render() {
    const timestamp = this.store.initTime
    const craving = this.store.craving;
    const date = new Date(timestamp);

    // console.log("Craving: ", craving);

    return html`
      <mwc-snackbar id="delete-error" leading> </mwc-snackbar>

      <div
        class="craving-container"
        style="display: flex; flex-direction: column"
        tabindex="0"
        @keypress.enter=${() => this.dispatchEvent(new CustomEvent("selected-craving", {
          detail: {
            cellId: this.store.service.cellId,
            craving,
          },
          bubbles: true,
          composed: true,
        }))}
        @click=${() => this.dispatchEvent(new CustomEvent("selected-craving", {
          detail: {
            cellId: this.store.service.cellId,
            craving,
          },
          bubbles: true,
          composed: true,
        }))}
      >
        <div class="row" style="text-align: right; font-size: 14px; color: black; width: 100%; margin-bottom: 10px;">
          ${this.renderCounts()}
          <span style="display: flex; flex: 1;"></span>
          <span style="font-size: 14px;">installed ${timeAgo.format(date)}</span>
        </div>
        <div class="craving-title">${craving.title}</div>
        <div class="craving-description">${craving.description}</div>

        <div class="column" style="flex: 1; align-items: flex-end; width: 100%;">
          <div class="row" style="margin-top: 5px; justify-content: flex-end; margin-right: -15px; overflow-x: auto;">
            ${
              this._lobbiesForCraving.value.map((lobbyData) => {
                if (lobbyData.info?.logo_src) {
                  return html`<img title=${lobbyData.name} src=${lobbyData.info.logo_src} style="height: 50px; width: 50px; border-radius: 50%; margin: 5px 2px 12px 2px;" />`
                }
            })
            }
          </div>
        </div>

      </div>
    `;
  }



  static styles = [sharedStyles,
    css`
    .craving-container {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      width: 380px;
      height: 260px;
      margin: 10px;
      background: #818cae;
      border-radius: 10px;
      box-shadow: 2px 2px 4px 3px #1e253d;
      padding: 18px 30px 3px 30px;
      cursor: pointer;
    }

    .craving-container:hover {
      background: #9098b3;
    }

    .craving-title {
      white-space: pre-line;
      font-weight: bold;
      font-size: 28px;
      text-align: left;
      color: #0b0d15;
    }

    .craving-description {
      white-space: normal;
      text-align: left;
      font-size: 19px;
      height: 120px;
      overflow-y: auto;
      margin-top: 10px;
      color: #0b0d15;
    }
  `];
}
