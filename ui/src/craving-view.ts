/* eslint-disable no-shadow */
import { LitElement, html, css } from 'lit';
import { state, customElement, property, query } from 'lit/decorators.js';
import {
  AppClient,
  encodeHashToBase64,
  DnaHash,
  DnaHashB64,
} from '@holochain/client';
import { consume } from '@lit-labs/context';
import { localized } from '@lit/localize';
import { EntryRecord } from '@holochain-open-dev/utils';

import '@material/mwc-circular-progress';

import './condenser/craving-detail';
import './condenser/create-association';
import './condenser/association-map';
import './condenser/all-offers';
import './condenser/create-offer';
import './condenser/offer-element';
import './condenser/reflection-element';
import './condenser/all-reflections';
import './condenser/create-reflection';
import './craving-context';

import { sharedStyles } from './sharedStyles';
import { Craving } from './condenser/types';
import { AssociationMap } from './condenser/association-map';

import { clientContext, condenserContext } from './contexts';
import { CondenserStore } from './condenser-store';
import { getNickname } from './utils';

@localized()
@customElement('craving-view')
export class CravingView extends LitElement {
  @consume({ context: clientContext })
  client!: AppClient;

  @consume({ context: condenserContext })
  condenserStore!: CondenserStore;

  @property({ type: Object })
  craving!: EntryRecord<Craving>;

  @query('#association-map')
  associationMap!: AssociationMap;

  @state()
  showDescription: boolean = true;

  @state()
  myNickName!: string;

  @state()
  sortOffersBy: 'latest' | 'resonanceTimeRatio' | 'resonanceAbsolute' =
    'resonanceAbsolute';

  @state()
  sortAssociationsBy: 'latest' | 'resonanceTimeRatio' | 'resonanceAbsolute' =
    'resonanceAbsolute';

  @state()
  sortReflectionsBy: 'latest' | 'oldest' = 'latest';

  @state()
  _selectedLobbies: DnaHashB64[] = [];

  firstUpdated() {
    // deterministically derive "random" name from public key and craving title
    this.myNickName = getNickname(
      this.client.myPubKey,
      this.craving.entry.title,
    );
  }

  handleSelectionClick(dnaHash: DnaHash) {
    const hashString = encodeHashToBase64(dnaHash);
    if (this._selectedLobbies.includes(hashString)) {
      const index = this._selectedLobbies.indexOf(hashString);
      this._selectedLobbies.splice(index, 1);
      (
        this.shadowRoot?.getElementById(hashString) as HTMLElement
      ).classList.remove('selected');
    } else {
      this._selectedLobbies.push(hashString);
      (
        this.shadowRoot?.getElementById(hashString) as HTMLElement
      ).classList.add('selected');
    }
    this.requestUpdate();
  }

  renderContent() {
    return html`
      <button
        @click=${() =>
          this.dispatchEvent(
            new CustomEvent('back-home', {
              bubbles: true,
              composed: true,
            }),
          )}
        class="btn-back"
        style="position: fixed; top: 10px; left: 10px;"
      >
        <div class="row" style="position: relative; align-items: center;">
          <span style="color: #ffd623ff; opacity: 0.68;">Home</span>
        </div>
      </button>

      <div
        class="column"
        style="align-items: center; flex: 1; width: 100%; margin-bottom: 80px;"
      >
        <div class="row top-bar">
          <div
            style="color: #929ab9; font-size: 40px; font-weight: bold; margin-left: 170px; text-align: left;"
          >
            ${this.craving.entry.title}
          </div>
          <span style="display: flex; flex: 1;"></span>

          <div style="margin-right: 20px;">
            <div
              class="row btn-collapse"
              style="${this.showDescription ? 'display: none;' : ''}"
              @click=${() => {
                this.showDescription = !this.showDescription;
              }}
              @keypress=${(e: KeyboardEvent) => {
                if (e.key === 'Enter') {
                  this.showDescription = !this.showDescription;
                }
              }}
            >
              <span style="font-size: 20px;">show description</span>
            </div>
          </div>

          <div
            class="column"
            style="align-items: flex-end; margin-right: 10px; margin-top: 10px;"
          >
            <div
              title="Yes, that's you!"
              style="font-size: 23px; color: #e06208; margin-bottom: 10px;"
            >
              ${this.myNickName}
            </div>
            <div
              title="We don't want to interfere,
with our collective atmosphere.
Being here is gift itself,
no need to brag -
nor to promote yourself!"
              style="font-size: 15px; width: 200px; text-align: right; color: #abb5d6;"
            >
              your random nickname for this craving
            </div>
          </div>
        </div>

        <div
          class="craving-description row"
          style="${this.showDescription ? '' : 'display: none;'}"
        >
          <div style="margin-left: 185px; margin-right: 70px;">
            ${this.craving.entry.description}
          </div>
        </div>

        <div
          style="margin-top: 20px; margin-bottom: 10px; ${this.showDescription
            ? ''
            : 'display: none;'}"
        >
          <div
            class="row btn-collapse"
            @click=${() => {
              this.showDescription = !this.showDescription;
            }}
            @keypress=${(e: KeyboardEvent) => {
              if (e.key === 'Enter') {
                this.showDescription = !this.showDescription;
              }
            }}
          >
            <span style="font-size: 20px;">collapse description</span>
          </div>
        </div>

        <div class="row" style="overflow-x: auto; width: 100%;">
          <div
            class="column box"
            style="flex-shrink: 0; width: 475px; margin-left: 20px;"
          >
            <div
              class="row"
              style="align-items: center; margin: 18px 10px 30px 23px;"
            >
              <img
                src="associations.png"
                alt="associations icon"
                style="height: 80px;"
              />
              <div
                style="font-size: 34px; margin-left: 10px; color: #ffc64cff;"
                title="What tickles your mind? Keep it short."
              >
                Associations
              </div>
            </div>
            <create-association
              .cravingHash=${this.craving}
            ></create-association>
            <div
              class="row"
              style="justify-content: flex-end; margin-right: 20px;"
            >
              <span
                tabindex="0"
                class=${this.sortAssociationsBy === 'latest'
                  ? 'order-selector-selected'
                  : 'order-selector'}
                @click=${() => {
                  this.sortAssociationsBy = 'latest';
                }}
                @keypress=${(e: KeyboardEvent) => {
                  if (e.key === 'Enter') {
                    this.sortAssociationsBy = 'latest';
                  }
                }}
                >latest</span
              >
              <span
                tabindex="0"
                class=${this.sortAssociationsBy === 'resonanceAbsolute'
                  ? 'order-selector-selected'
                  : 'order-selector'}
                @click=${() => {
                  this.sortAssociationsBy = 'resonanceAbsolute';
                }}
                @keypress=${(e: KeyboardEvent) => {
                  if (e.key === 'Enter') {
                    this.sortAssociationsBy = 'resonanceAbsolute';
                  }
                }}
                >most drops</span
              >
            </div>
            <association-map
              id="association-map"
              .cravingHash=${this.craving.actionHash}
              .sortBy=${this.sortAssociationsBy}
            ></association-map>
          </div>

          <div
            class="column box"
            style="flex-shrink: 0; width: 850px; padding: 10px;"
          >
            <div
              class="row"
              style="align-items: center; margin: 18px 10px 35px 10px;"
            >
              <img
                src="reflections.svg"
                alt="Reflections icon"
                style="height: 65px;"
              />
              <div
                style="font-size: 34px; margin-left: 10px; color: #ffc64cff;"
                title="Any thoughts about the topic? Explore untapped philosohical realms."
              >
                Reflections
              </div>
            </div>
            <create-reflection
              .cravingHash=${this.craving.actionHash}
            ></create-reflection>
            <div
              class="row"
              style="justify-content: flex-end; margin-right: 20px;"
            >
              <span
                tabindex="0"
                class=${this.sortReflectionsBy === 'latest'
                  ? 'order-selector-selected'
                  : 'order-selector'}
                @click=${() => {
                  this.sortReflectionsBy = 'latest';
                }}
                @keypress=${(e: KeyboardEvent) => {
                  if (e.key === 'Enter') {
                    this.sortReflectionsBy = 'latest';
                  }
                }}
                >latest</span
              >
              <span
                tabindex="0"
                class=${this.sortReflectionsBy === 'oldest'
                  ? 'order-selector-selected'
                  : 'order-selector'}
                @click=${() => {
                  this.sortReflectionsBy = 'oldest';
                }}
                @keypress=${(e: KeyboardEvent) => {
                  if (e.key === 'Enter') {
                    this.sortReflectionsBy = 'oldest';
                  }
                }}
                >oldest</span
              >
            </div>
            <all-reflections
              .cravingHash=${this.craving.actionHash}
              .sortBy=${this.sortReflectionsBy}
            ></all-reflections>
          </div>

          <div class="column box" style="flex-shrink: 0; width: 495px;">
            <div
              class="row"
              style="align-items: center; margin: 30px 10px 30px 23px;"
            >
              <img
                src="offers.svg"
                alt="Offers icon"
                style="height: 65px;"
                title="drip drop..."
              />
              <div
                style="font-size: 34px; margin-left: 10px; color: #ffc64cff;"
                title="Got a precious drop of liquified grammatical potential? Share it, make it real!"
              >
                Offers
              </div>
            </div>
            <create-offer
              .cravingHash=${this.craving.actionHash}
            ></create-offer>
            <div
              class="row"
              style="justify-content: flex-end; margin-right: 20px;"
            >
              <span
                tabindex="0"
                class=${this.sortOffersBy === 'latest'
                  ? 'order-selector-selected'
                  : 'order-selector'}
                @click=${() => {
                  this.sortOffersBy = 'latest';
                }}
                @keypress=${(e: KeyboardEvent) => {
                  if (e.key === 'Enter') {
                    this.sortOffersBy = 'latest';
                  }
                }}
                >latest</span
              >
              <span
                tabindex="0"
                class=${this.sortOffersBy === 'resonanceAbsolute'
                  ? 'order-selector-selected'
                  : 'order-selector'}
                @click=${() => {
                  this.sortOffersBy = 'resonanceAbsolute';
                }}
                @keypress=${(e: KeyboardEvent) => {
                  if (e.key === 'Enter') {
                    this.sortOffersBy = 'resonanceAbsolute';
                  }
                }}
                >most drops</span
              >
            </div>
            <all-offers
              id="all-offers"
              .cravingHash=${this.craving.actionHash}
              .sortBy=${this.sortOffersBy}
            ></all-offers>
          </div>
        </div>
      </div>
    `;
  }

  render() {
    return html`
      <craving-context
        .cravingStore=${this.condenserStore.cravingStore(
          this.craving.actionHash,
        )}
      >
        ${this.renderContent()}
      </craving-context>
    `;
  }

  static styles = [
    sharedStyles,
    css`
      .btn-back {
        all: unset;
        background-color: #ffd7230e;
        cursor: pointer;
        color: #9ba4c2;
        padding: 20px;
        border-radius: 20px;
      }

      .btn-back:focus {
        background-color: #ffd72384;
      }

      .btn-back:hover {
        background-color: #ffd7231c;
      }

      .top-bar {
        width: calc(100% - 20px);
        align-items: center;
        margin: 10px;
      }

      .craving-description {
        color: #abb5d6;
        width: 100%;
        align-items: left;
        font-size: 20px;
        text-align: left;
        margin-top: 10px;
        line-height: 30px;
        white-space: pre-wrap;
      }

      .btn-collapse {
        align-items: center;
        cursor: pointer;
        color: #9ba4c2;
        padding: 10px 20px;
        border: 1px solid #9ba4c2;
        border-radius: 30px;
      }

      .btn-collapse:hover {
        background-color: #9ba4c221;
        /* border: 1px solid transparent; */
      }

      .box {
        /* border: 2px solid #ffc64c94; */
        border-radius: 25px;
        margin: 10px;
        padding-bottom: 10px;
        background: #fff6e309;
      }

      .icon {
        background: transparent;
        border-radius: 20px;
        padding: 8px;
      }

      .icon:hover {
        background: #abb5d638;
        border-radius: 20px;
        padding: 8px;
      }

      .order-selector {
        cursor: pointer;
        font-size: 18px;
        color: #9ba4c2;
        background: transparent;
        border-radius: 8px;
        padding: 8px;
        margin: 3px;
      }

      .order-selector:hover {
        background: #abb5d638;
        border-radius: 8px;
        padding: 8px;
        margin: 3px;
      }

      .order-selector-selected {
        cursor: pointer;
        font-size: 18px;
        color: #9ba4c2;
        background: #abb5d638;
        border-radius: 8px;
        padding: 8px;
        margin: 3px;
      }

      .confirm-btn {
        background: transparent;
        border-radius: 10px;
        padding: 8px 15px;
        cursor: pointer;
      }

      .confirm-btn:hover {
        background: #abb5d638;
        border-radius: 10px;
        padding: 8px 15px;
      }

      .cancel-btn {
        background: transparent;
        border-radius: 10px;
        padding: 8px 15px;
        cursor: pointer;
      }

      .cancel-btn:hover {
        background: #9e1e1e56;
        border-radius: 10px;
        padding: 8px 15px;
      }

      .group-selection-element {
        display: flex;
        flex-direction: row;
        align-items: center;
        font-size: 19px;
        color: #98a3cf;
        min-height: 90px;
        min-width: 600px;
        background: #c5cded09;
        border-radius: 12px;
        border: 1px solid transparent;
        margin: 6px;
        cursor: pointer;
      }

      .group-selection-element:hover {
        background: #c5cded38;
      }

      .selected {
        background: #c5cded38;
        border: 1px solid #c5cded;
      }
    `,
  ];
}
