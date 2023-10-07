import { LitElement, html, css } from 'lit';
import { state, customElement, property } from 'lit/decorators.js';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import { encodeHashToBase64 } from '@holochain/client';

import '@material/mwc-circular-progress';
import '@material/mwc-icon-button';
import '@material/mwc-snackbar';

import { consume } from '@lit-labs/context';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import { condenserContext } from '../contexts';
import { CravingStore } from '../craving-store';
import { CondenserStore } from '../condenser-store';
import { sharedStyles } from '../sharedStyles';
import {
  newAssociationsCount,
  newOffersCount,
  newCommentsCount,
  newReflectionsCount,
  getNotifiedOffersCount,
  isKangaroo,
  setNotifiedOffersCount,
  getNotifiedCommentsCount,
  setNotifiedCommentsCount,
  getNotifiedReflectionsCount,
  setNotifiedReflectionsCount,
  getCravingNotificationSettings,
  getNotifiedAssociationsCount,
  setNotifiedAssociationsCount,
} from '../utils';

TimeAgo.addDefaultLocale(en);
const timeAgo = new TimeAgo('en-US');

@customElement('craving-detail')
export class CravingDetail extends LitElement {
  @consume({ context: condenserContext })
  condenserStore!: CondenserStore;

  @property()
  store!: CravingStore;

  @state()
  _editing = false;

  private _lobbiesForCraving = new StoreSubscriber(this, () =>
    this.condenserStore.getLobbiesForCraving(this.store.service.cellId[0]),
  );

  private _allReflections = new StoreSubscriber(
    this,
    () => this.store.allReflections,
  );

  private _allCommentCount = new StoreSubscriber(
    this,
    () => this.store.allCommentsCount,
  );

  private _allOffers = new StoreSubscriber(this, () => this.store.polledOffers);

  private _allAssociations = new StoreSubscriber(
    this,
    () => this.store.polledAssociations,
  );

  private _amIFiltered = new StoreSubscriber(this, () =>
    this.condenserStore.amIFiltered(
      this._lobbiesForCraving.value.map(data => data.dnaHash),
    ),
  );

  // [number of total associations total, number of new associations]
  associationsCount(): [string, string | undefined] {
    switch (this._allAssociations.value.status) {
      case 'pending':
        return ['?', undefined];
      case 'error':
        return ['?', undefined];
      case 'complete': {
        const cravingDnaHash = this.store.service.cellId[0];
        const currentCount = this._allAssociations.value.value.length;
        const newCount = newAssociationsCount(
          this.store.service.cellId[0],
          currentCount,
        );
        const notifiedCount =
          getNotifiedAssociationsCount(encodeHashToBase64(cravingDnaHash)) || 0;
        if (isKangaroo() && currentCount > notifiedCount) {
          const notificationSettings = getCravingNotificationSettings(
            encodeHashToBase64(cravingDnaHash),
          );
          if (
            notificationSettings.associations.os ||
            notificationSettings.associations.systray
          ) {
            this.dispatchEvent(
              new CustomEvent('notify-os', {
                detail: {
                  notification: {
                    title: 'New Association',
                    body: 'New Association',
                    urgency: 'medium',
                  },
                  os: notificationSettings.associations.os,
                  systray: notificationSettings.associations.systray,
                },
                bubbles: true,
                composed: true,
              }),
            );
          }
          setNotifiedAssociationsCount(
            encodeHashToBase64(cravingDnaHash),
            currentCount,
          );
        }
        return [
          currentCount.toString(),
          newCount ? newCount.toString() : undefined,
        ];
      }
      default:
        return ['?', undefined];
    }
  }

  reflectionCount(): [string, string | undefined] {
    switch (this._allReflections.value.status) {
      case 'pending':
        return ['?', undefined];
      case 'error':
        return ['?', undefined];
      case 'complete': {
        const cravingDnaHash = this.store.service.cellId[0];
        const currentCount = this._allReflections.value.value.length;
        const newCount = newReflectionsCount(cravingDnaHash, currentCount);
        const notifiedCount =
          getNotifiedReflectionsCount(encodeHashToBase64(cravingDnaHash)) || 0;
        if (isKangaroo() && currentCount > notifiedCount) {
          const notificationSettings = getCravingNotificationSettings(
            encodeHashToBase64(cravingDnaHash),
          );
          if (
            notificationSettings.reflections.os ||
            notificationSettings.reflections.systray
          ) {
            this.dispatchEvent(
              new CustomEvent('notify-os', {
                detail: {
                  notification: {
                    title: 'New Reflection',
                    body: 'New Reflection',
                    urgency: 'medium',
                  },
                  os: notificationSettings.reflections.os,
                  systray: notificationSettings.reflections.systray,
                },
                bubbles: true,
                composed: true,
              }),
            );
          }
          setNotifiedReflectionsCount(
            encodeHashToBase64(cravingDnaHash),
            currentCount,
          );
        }
        return [
          currentCount.toString(),
          newCount ? newCount.toString() : undefined,
        ];
      }
      default:
        return ['?', undefined];
    }
  }

  commentsCount(): string | undefined {
    switch (this._allCommentCount.value.status) {
      case 'pending':
        return undefined;
      case 'error':
        return undefined;
      case 'complete': {
        const cravingDnaHash = this.store.service.cellId[0];
        const currentCount = this._allCommentCount.value.value;
        const newCount = newCommentsCount(cravingDnaHash, currentCount);
        const notifiedCount =
          getNotifiedCommentsCount(encodeHashToBase64(cravingDnaHash)) || 0;
        if (isKangaroo() && currentCount > notifiedCount) {
          const notificationSettings = getCravingNotificationSettings(
            encodeHashToBase64(cravingDnaHash),
          );
          if (
            notificationSettings.comments.os ||
            notificationSettings.comments.systray
          ) {
            this.dispatchEvent(
              new CustomEvent('notify-os', {
                detail: {
                  notification: {
                    title: 'New Comment',
                    body: 'New Comment',
                    urgency: 'medium',
                  },
                  os: notificationSettings.comments.os,
                  systray: notificationSettings.comments.systray,
                },
                bubbles: true,
                composed: true,
              }),
            );
          }
          setNotifiedCommentsCount(
            encodeHashToBase64(cravingDnaHash),
            currentCount,
          );
        }
        return newCount ? newCount.toString() : undefined;
      }
      default:
        return undefined;
    }
  }

  offersCount(): [string, string | undefined] {
    switch (this._allOffers.value.status) {
      case 'pending':
        return ['?', undefined];
      case 'error':
        return ['?', undefined];
      case 'complete': {
        const cravingDnaHash = this.store.service.cellId[0];
        const currentCount = this._allOffers.value.value.length;
        const newCount = newOffersCount(cravingDnaHash, currentCount);
        const notifiedCount =
          getNotifiedOffersCount(encodeHashToBase64(cravingDnaHash)) || 0;

        if (isKangaroo() && currentCount > notifiedCount) {
          const notificationSettings = getCravingNotificationSettings(
            encodeHashToBase64(cravingDnaHash),
          );
          if (
            notificationSettings.offers.os ||
            notificationSettings.offers.systray
          ) {
            this.dispatchEvent(
              new CustomEvent('notify-os', {
                detail: {
                  notification: {
                    title: 'New Offer',
                    body: 'New Offer',
                    urgency: 'medium',
                  },
                  os: notificationSettings.offers.os,
                  systray: notificationSettings.offers.systray,
                },
                bubbles: true,
                composed: true,
              }),
            );
          }
          setNotifiedOffersCount(
            encodeHashToBase64(cravingDnaHash),
            currentCount,
          );
        }

        return [
          currentCount.toString(),
          newCount ? newCount.toString() : undefined,
        ];
      }
      default:
        return ['?', undefined];
    }
  }

  renderCounts() {
    const associationCounts = this.associationsCount();
    const reflectionCounts = this.reflectionCount();
    const commentsCounts = this.commentsCount();
    const offerCounts = this.offersCount();

    return html`
      <div class="row" stye="align-items: center;">
        <div style="position: relative;">
          <span
            style="font-size: 19px; margin-right: 4px;"
            title="${associationCounts[0]} associations"
          >
            ${associationCounts[0]}
          </span>
          ${associationCounts[1]
            ? html`
                <div
                  class="notification yellow"
                  style="position: absolute; top: -10px; left: 16px;"
                  title="${associationCounts[1]} new association${associationCounts[1] !==
                  '1'
                    ? 's'
                    : ''}"
                >
                  +${associationCounts[1]}
                </div>
              `
            : html``}
        </div>
        <img
          src="associations.png"
          alt="associations icon"
          style="height: 30px; margin-right: 6px;"
          title="${associationCounts} associations"
        />

        <div style="position: relative;">
          <span
            style="font-size: 19px; margin-right: 4px;"
            title="${reflectionCounts[0]} reflections"
          >
            ${reflectionCounts[0]}
          </span>
          <div
            style="position: absolute; top: -10px; left: 16px; display: flex; flex-direction: column;"
          >
            ${reflectionCounts[1]
              ? html`
                  <div
                    class="notification yellow"
                    style="margin-bottom: 2px;"
                    title="${reflectionCounts[1]} new reflection${reflectionCounts[1] !==
                    '1'
                      ? 's'
                      : ''}"
                  >
                    +${reflectionCounts[1]}
                  </div>
                `
              : html``}
            ${commentsCounts
              ? html`
                  <div
                    class="notification blue"
                    title="${commentsCounts} new comment${commentsCounts !== '1'
                      ? 's'
                      : ''}"
                  >
                    +${commentsCounts}
                  </div>
                `
              : html``}
          </div>
        </div>
        <img
          src="reflections_black.svg"
          alt="Reflections icon"
          style="height: 30px; margin-right: 6px;"
          title="${reflectionCounts} reflections"
        />

        <div style="position: relative;">
          <span
            style="font-size: 19px; margin-right: 4px;"
            title="${offerCounts[0]} offers"
          >
            ${offerCounts[0]}
          </span>
          ${offerCounts[1]
            ? html`
                <div
                  class="notification yellow"
                  style="position: absolute; top: -10px; left: 16px;"
                  title="${offerCounts[1]} new offer${offerCounts[1] !== '1'
                    ? 's'
                    : ''}"
                >
                  +${offerCounts[1]}
                </div>
              `
            : html``}
        </div>
        <img
          src="offers.svg"
          alt="Half filled Erlenmeyer flask to signify word offers"
          style="height: 30px;"
          title="${offerCounts[0]} offers"
        />
      </div>
    `;
  }

  render() {
    if (this._amIFiltered.value) {
      return html``;
    }

    const timestamp = this.store.initTime;
    const craving = this.store.craving;
    const date = new Date(timestamp);

    // console.log("Craving: ", craving);

    return html`
      <mwc-snackbar id="delete-error" leading> </mwc-snackbar>

      <div
        class="craving-container"
        style="display: flex; flex-direction: column"
        tabindex="0"
        @keypress=${(e: KeyboardEvent) =>
          e.key === 'Enter'
            ? this.dispatchEvent(
                new CustomEvent('selected-craving', {
                  detail: {
                    cellId: this.store.service.cellId,
                    craving,
                  },
                  bubbles: true,
                  composed: true,
                }),
              )
            : undefined}
        @click=${() =>
          this.dispatchEvent(
            new CustomEvent('selected-craving', {
              detail: {
                cellId: this.store.service.cellId,
                craving,
              },
              bubbles: true,
              composed: true,
            }),
          )}
      >
        <div
          class="row"
          style="text-align: right; font-size: 14px; color: black; width: 100%; margin-bottom: 10px;"
        >
          ${this.renderCounts()}
          <span style="display: flex; flex: 1;"></span>
          <span style="font-size: 14px;"
            >installed ${timeAgo.format(date)}</span
          >
        </div>
        <div class="craving-title">${craving.title}</div>
        <div class="craving-description">${craving.description}</div>

        <div
          class="column"
          style="flex: 1; align-items: flex-end; width: 100%;"
        >
          <div
            class="row"
            style="margin-top: 5px; justify-content: flex-end; margin-right: -15px; overflow-x: auto;"
          >
            ${this._lobbiesForCraving.value.map(lobbyData => {
              if (lobbyData.info?.logo_src) {
                return html`<img
                  title=${lobbyData.name}
                  alt="Group logo"
                  src=${lobbyData.info.logo_src}
                  style="height: 50px; width: 50px; border-radius: 50%; margin: 5px 2px 12px 2px;"
                />`;
              }
              return html``;
            })}
          </div>
        </div>
      </div>
    `;
  }

  static styles = [
    sharedStyles,
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

      .notification {
        padding: 1px 5px;
        font-size: 16px;
        font-weight: 600;
        border-radius: 10px;
        height: 20px;
        color: black;
        min-width: 18px;
        display: flex;
        justify-content: center;
        align-items: center;
        box-shadow: 1px 1px 3px #0b0d159b;
      }

      .yellow {
        background: #ffd623;
      }

      .blue {
        background: #9ecbf2;
      }
    `,
  ];
}
