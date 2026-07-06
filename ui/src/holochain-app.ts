import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import {
  ActionHash,
  AppClient,
  AppWebsocket,
  CellId,
  decodeHashFromBase64,
  encodeHashToBase64,
} from '@holochain/client';
import { provide } from '@lit-labs/context';
import '@material/mwc-circular-progress';

import {
  ProfilesStore,
  profilesStoreContext,
} from '@holochain-open-dev/profiles';
import {
  initializeHotReload,
  isWeaveContext,
  WeaveClient,
} from '@theweave/api';
import { EntryRecord } from '@holochain-open-dev/utils';

import { clientContext, condenserContext } from './contexts';
import { DashboardMode, weaveClientContext } from './types';
import { CondenserStore } from './condenser-store';
import { sharedStyles } from './sharedStyles';

import '@fontsource/poppins';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '@fontsource/poppins/800.css';
import '@fontsource/poppins/900.css';

import './condenser/create-craving';
import './condenser/all-cravings';
import './condenser/all-disabled-cravings';
import './condenser/all-available-cravings';
import './craving-view';
import './intro';
import './no-cookies-ever';
import './loading-animation';
import { Craving } from './condenser/types';

@customElement('holochain-app')
export class HolochainApp extends LitElement {
  @state() loading = true;

  @state() _dashboardMode = DashboardMode.Home;

  @state() _selectedCraving: EntryRecord<Craving> | undefined = undefined;

  @state() _deepLink: string | undefined = undefined;

  @state() _cravingMenuItem: 'installed' | 'available' | 'disabled' =
    'installed';

  @provide({ context: clientContext })
  @property({ type: Object })
  client!: AppClient;

  @provide({ context: weaveClientContext })
  @property({ type: Object })
  _weaveClient!: WeaveClient;

  @provide({ context: profilesStoreContext })
  @property({ type: Object })
  _profilesStore!: ProfilesStore;

  @provide({ context: condenserContext })
  @property({ type: Object })
  store!: CondenserStore;

  async firstUpdated() {
    console.log('FIRST UPDATED!');
    if ((import.meta as any).env.DEV) {
      try {
        await initializeHotReload();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(
          'Could not initialize applet hot-reloading. This is only expected to work in a We context in dev mode.',
        );
      }
    }
    if (isWeaveContext()) {
      const weaveClient = await WeaveClient.connect();
      if (
        weaveClient.renderInfo.type !== 'applet-view' ||
        !['main'].includes(weaveClient.renderInfo.view.type)
      )
        throw new Error(
          'This Applet only implements the applet main and asset views.',
        );
      this.client = weaveClient.renderInfo.appletClient as any;
      this._weaveClient = weaveClient;
      this._profilesStore = new ProfilesStore(
        weaveClient.renderInfo.profilesClient as any,
      );
    } else {
      // We pass an unused string as the url because it will dynamically be replaced in launcher environments
      this.client = await AppWebsocket.connect();
    }
    this.store = new CondenserStore(this.client, this._weaveClient);

    // check where to route after refresh
    const previousDashboardMode = window.localStorage.getItem(
      'previousDashboardMode',
    );

    if (!previousDashboardMode) {
      this.loading = false;
      return;
    }

    const maybeLastRefresh = window.localStorage.getItem('lastRefresh');

    if (maybeLastRefresh) {
      const lastRefresh = parseInt(maybeLastRefresh, 10);
      // ignore localstorage items if the last refresh is older than 2 seconds, for example when the
      // Word Condenser has just been started up after a while
      if (Date.now() - lastRefresh < 2000) {
        switch (previousDashboardMode) {
          case 'Home':
            this._dashboardMode = DashboardMode.Home;
            break;

          case 'CreateCravingView':
            this._dashboardMode = DashboardMode.Home;
            break;

          case 'Settings':
            this._dashboardMode = DashboardMode.Settings;
            break;

          case 'NoCookiesEVER':
            this._dashboardMode = DashboardMode.NoCookiesEVER;
            break;

          case 'CravingView': {
            this._selectedCraving = JSON.parse(
              window.localStorage.getItem('selectedCraving') as string,
            );
            this._dashboardMode = DashboardMode.CravingView;
            break;
          }

          default:
            this._dashboardMode = DashboardMode.Home;
            break;
        }
      }
    }

    this.loading = false;
  }

  handleRefresh() {
    window.localStorage.setItem('lastRefresh', Date.now().toString());

    switch (this._dashboardMode) {
      case DashboardMode.Home:
        window.localStorage.setItem('previousDashboardMode', 'Home');
        window.location.reload();
        break;

      case DashboardMode.Settings:
        window.localStorage.setItem('previousDashboardMode', 'Settings');
        window.location.reload();
        break;

      case DashboardMode.NoCookiesEVER:
        window.localStorage.setItem('previousDashboardMode', 'NoCookiesEVER');
        window.location.reload();
        break;

      case DashboardMode.CravingView:
        window.localStorage.setItem(
          'selectedCravingHash',
          encodeHashToBase64(this._selectedCraving!.actionHash),
        );
        window.localStorage.setItem(
          'selectedCraving',
          JSON.stringify(this._selectedCraving),
        );
        window.localStorage.setItem('previousDashboardMode', 'CravingView');
        window.location.reload();
        break;

      case DashboardMode.CreateCravingView:
        window.localStorage.setItem('previousDashboardMode', 'Home');
        break;

      default:
        window.localStorage.setItem('previousDashboardMode', 'Home');
        window.location.reload();
        break;
    }
  }

  getSlogan() {
    const slogans = [
      "« Let's pull our jewels into here - from our collective atmosphere »",
      "« Let's have us stick our heads together - those precious drops of words to gather »",
      "« What yet we're vaguely only seeing - let's not wait, let's speak it into being! »",
    ];
    const now = Date.now();
    return slogans[Math.floor(now / 900000) % slogans.length]; // same slogan for 15 minutes
  }

  colorSentence(sentence: string) {
    const colors = [
      '#dd2c32',
      '#24d300ff',
      '#11f8f1ff',
      '#ffe523ff',
      '#bb54ea',
    ];

    return sentence.split(' ').map(word => {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      return html`<span style="color: ${randomColor}">${word}&nbsp;</span>`;
    });
  }

  renderBottom() {
    return html``;
  }

  renderCravings() {
    return html`
      <div
        id="content"
        class="column"
        style="align-items: flex-start; width: 100%;"
      >
        <all-cravings
          id="all-cravings"
          @selected-craving=${(e: CustomEvent) => {
            this._selectedCraving = e.detail.craving;
            this._dashboardMode = DashboardMode.CravingView;
          }}
        >
        </all-cravings>
      </div>
    `;
  }

  renderDashBoard() {
    return html` ${this.renderCravings()}`;
  }

  renderHome() {
    switch (this._dashboardMode) {
      case DashboardMode.Home:
        return html`
          <div style="padding: 40px; align-items: center;" class="column">
            ${!window.localStorage.getItem('hide-logo')
              ? html`
                  <div style="margin-top: -50px; margin-bottom: 20px;">
                    <img
                      alt="Logo of the Word Condenser"
                      title="Hi, I am the Word Condenser! I am condensing words that are latently dissolved across the humid space of human experience and imagination"
                      src="word_condenser_logo.svg"
                      class="logo"
                    />
                  </div>
                  <div
                    style="color: #b1bae0; font-size: 25px; opacity: 0.85; margin-top: -15px; margin-bottom: 70px; font-style: italic; max-width: 1200px;"
                  >
                    ${this.getSlogan()}
                  </div>
                `
              : html`<div style="height: 60px;"></div>`}

            <button
              @click=${() => {
                this._dashboardMode = DashboardMode.CreateCravingView;
              }}
              @keypress=${() => {
                this._dashboardMode = DashboardMode.CreateCravingView;
              }}
              class="btn-create-craving"
            >
              <div
                class="row"
                style="position: relative; align-items: center;"
                title="craving for a word??"
              >
                <img
                  src="empty_glass.svg"
                  alt="Icon of an empty Erlenmeyer flask"
                  style="height: 50px;"
                />
                <span
                  style="color: #ffd623ff; opacity: 0.85; margin-left: 12px;"
                  >Add Craving</span
                >
              </div>
            </button>

            ${this.renderDashBoard()}
          </div>

          <img
            class="icon"
            alt="Setting icon"
            src="settings_icon.svg"
            style="height: 53px; position: fixed; bottom: 10px; right: 10px; cursor: pointer;"
            title="Settings"
            tabindex="0"
            @click=${() => {
              this._dashboardMode = DashboardMode.Settings;
            }}
            @keypress=${() => {
              this._dashboardMode = DashboardMode.Settings;
            }}
          />
        `;
      // #################  CravingView  #######################
      case DashboardMode.CravingView:
        return html`
          <craving-view
            style="display: flex; flex: 1; width: 100%;"
            @back-home=${() => {
              this._dashboardMode = DashboardMode.Home;
              this._selectedCraving = undefined;
            }}
            .craving=${this._selectedCraving}
          >
          </craving-view>
        `;
      // #################  CreateCravingView  #######################
      case DashboardMode.CreateCravingView:
        return html`
          <button
            @click=${() => {
              this._dashboardMode = DashboardMode.Home;
              this._selectedCraving = undefined;
            }}
            class="btn-back"
          >
            <div class="row" style="position: relative; align-items: center;">
              <span style="color: #ffd623ff; opacity: 0.68;">Back</span>
            </div>
          </button>
          <div style="margin-top: 20px;">
            <create-craving
              @craving-created=${async (e: CustomEvent) => {
                this._selectedCraving = e.detail.craving;
                this.handleRefresh();
                this._dashboardMode = DashboardMode.CravingView;
              }}
            ></create-craving>
          </div>
        `;
      // #################  Settings  #######################
      case DashboardMode.Settings:
        return html`
          <button
            @click=${() => {
              this._dashboardMode = DashboardMode.Home;
              this._selectedCraving = undefined;
            }}
            class="btn-back"
          >
            <div class="row" style="position: relative; align-items: center;">
              <span style="color: #ffd623ff; opacity: 0.68;">Back</span>
            </div>
          </button>

          <div
            style="color: #929ab9; position: fixed; bottom: 10px; right: 20px; font-size: 1em; opacity: 0.8;"
          >
            version 0.2.X
          </div>

          <h1 style="color: #929ab9; margin-bottom: 100px;">Settings</h1>

          <div
            class="column"
            style="align-items: center; max-width: 1600px; flex: 1; margin: auto;"
          >
            <div
              class="row"
              style="align-items: center; width: 100%; justify-content: center;"
            >
              ${window.localStorage.getItem('hide-logo')
                ? html`
                    <img
                      src="switch_off.svg"
                      alt="switch off button icon"
                      style="height: 50px; cursor: pointer;"
                      tabindex="0"
                      @click=${() => {
                        window.localStorage.removeItem('hide-logo');
                        this.requestUpdate();
                      }}
                      @keypress=${() => {
                        window.localStorage.removeItem('hide-logo');
                        this.requestUpdate();
                      }}
                    />
                  `
                : html`
                    <img
                      src="switch_on.svg"
                      alt="switch on button icon"
                      style="height: 50px; cursor: pointer;"
                      tabindex="0"
                      @click=${() => {
                        window.localStorage.setItem('hide-logo', 'true');
                        this.requestUpdate();
                      }}
                      @keypress=${() => {
                        window.localStorage.setItem('hide-logo', 'true');
                        this.requestUpdate();
                      }}
                    />
                  `}
              <span
                style="color: #abb5da; font-size: 0.9em; margin-left: 10px; margin-top: 12px; text-align: left;"
              >
                show Word Condenser logo and slogans on the main page
              </span>
            </div>

            <div
              class="confirm-btn"
              style="align-items: center; margin-top: 30px; margin-bottom: 20px; margin-top: 150px;"
              tabindex="0"
              @click=${() => {
                window.localStorage.removeItem('intro-seen');
                this.requestUpdate();
              }}
              @keypress=${(e: KeyboardEvent) => {
                if (e.key === 'Enter') {
                  window.localStorage.removeItem('intro-seen');
                  this.requestUpdate();
                }
              }}
            >
              <span style="color: #abb5d6; font-size: 1em;"
                >Show Intro Again</span
              >
            </div>

            <div
              class="confirm-btn"
              style="align-items: center; margin-top: 30px; margin-bottom: 80px;"
              tabindex="0"
              @click=${() => {
                this._dashboardMode = DashboardMode.NoCookiesEVER;
              }}
              @keypress=${() => {
                this._dashboardMode = DashboardMode.NoCookiesEVER;
              }}
            >
              <span style="color: #abb5d6; font-size: 1em;"
                >Accept to not need to accept Cookies</span
              >
            </div>

            <div
              class="confirm-btn column"
              style="align-items: center; margin-top: 30px; margin-bottom: 80px;"
              tabindex="0"
              @click=${() => {
                throw new Error('Not implemented');
              }}
              @keypress=${() => {
                throw new Error('Not implemented');
              }}
            >
              <img
                src="report_problem.svg"
                alt="Report problem icon"
                style="height: 40px; margin-bottom: 10px;"
              />
              <div
                style="color: #abb5d6; font-size: 1em; color: #ffc64c; opacity: 0.9;"
              >
                Report A Problem
              </div>
            </div>
          </div>
        `;

      // #################  No Cookies ever  #######################
      case DashboardMode.NoCookiesEVER:
        return html`
          <no-cookies-ever
            @accepted-to-not-ever-need-to-accept-cookies=${() => {
              this._dashboardMode = DashboardMode.Settings;
            }}
          ></no-cookies-ever>
        `;

      default:
        return html`You found the broom closet`;
    }
  }

  render() {
    if (this.loading) return html` <loading-animation></loading-animation> `;

    return html`
      <main style="position: relative;">
        ${window.localStorage.getItem('intro-seen')
          ? this.renderHome()
          : html`<intro-section
              @intro-finished=${() => this.requestUpdate()}
            ></intro-section>`}
        ${this._dashboardMode !== DashboardMode.Settings &&
        window.localStorage.getItem('intro-seen')
          ? html`<img
              class="icon"
              src="refresh.svg"
              alt="Refresh icon"
              style="height: 53px; position: fixed; bottom: 10px; left: 10px; cursor: pointer;"
              title="Refresh"
              tabindex="0"
              @click=${() => this.handleRefresh()}
              @keypress=${() => this.handleRefresh()}
            />`
          : html``}
        ${window.localStorage.getItem('intro-seen')
          ? html``
          : html`
              <div
                class="confirm-btn"
                style="align-items: center; margin-top: 30px; position: absolute; bottom: 15px; left: 15px; "
                tabindex="0"
                @click=${() => {
                  window.localStorage.setItem('intro-seen', 'true');
                  this.handleRefresh();
                }}
                @keypress=${(e: KeyboardEvent) => {
                  if (e.key === 'Enter') {
                    window.localStorage.setItem('intro-seen', 'true');
                    this.handleRefresh();
                  }
                }}
              >
                <span style="color: #abb5d6; font-size: 1em;">Skip Intro</span>
              </div>
            `}
      </main>
    `;
  }

  static styles = [
    sharedStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        align-items: center;
        font-family: Poppins, sans-serif;
        justify-content: flex-start;
        font-size: calc(10px + 2vmin);
        /* color: #1a2b42; */
        width: 100vw;
        min-height: 100vh;
        margin: 0;
        text-align: center;
        background-color: #272f3a;
        /* background-color: var(--lit-element-background-color); */
        --font-active-color: 255, 198, 76;
        --background-hover-color: #ffd7230e;
        color: rgb(var(--font-active-color));
      }

      main {
        flex: 1;
        width: 100%;
      }

      .app-footer {
        font-size: calc(12px + 0.5vmin);
        align-items: center;
      }

      .app-footer a {
        margin-left: 5px;
      }

      .btn-back {
        all: unset;
        cursor: pointer;
        position: fixed;
        top: 10px;
        left: 10px;
        color: #9098b3;
        padding: 20px;
        border-radius: 20px;
        background-color: #ffd7230e;
      }

      .btn-back:focus {
        background-color: #ffd72384;
      }

      .btn-back:hover {
        background-color: #ffd7231c;
      }

      .left-buttons {
        position: fixed;
        top: 10px;
        left: 10px;
      }

      .btn-join-group {
        all: unset;
        cursor: pointer;
        color: #9098b3;
        padding: 20px;
        border-radius: 20px;
        background-color: #ffd7230e;
        margin-right: 10px;
      }

      .btn-join-group:focus {
        background-color: #ffd72384;
      }

      .btn-join-group:hover {
        background-color: #ffd7231c;
      }

      .btn-create-craving {
        all: unset;
        background-color: #ffd7230e;
        cursor: pointer;
        position: fixed;
        top: 10px;
        right: 10px;
        color: #9098b3;
        padding: 20px;
        border-radius: 20px;
      }

      .btn-create-craving:focus {
        background-color: #ffd72384;
      }

      .btn-create-craving:hover {
        background-color: #ffd7231c;
      }

      .btn-create-lobby {
        all: unset;
        cursor: pointer;
        background-color: #ffd7230e;
        color: #9098b3;
        padding: 20px;
        border-radius: 20px;
        border: 1px solid #ffc64c;
        margin: 10px;
      }

      .btn-create-lobby:hover {
        background-color: #ffd7231c;
      }

      .confirm-btn {
        background: #abb5d61a;
        border-radius: 10px;
        padding: 15px 30px;
        cursor: pointer;
      }

      .confirm-btn:hover {
        background: #abb5d638;
        border-radius: 10px;
        padding: 15px 30px;
      }

      .light-bulb-note {
        border-radius: 15px;
        color: #bfdec1;
        border: 3px solid #21c30062;
        background: #2bff0017;
        padding: 15px 20px;
        text-align: left;
        margin-bottom: 50px;
      }

      .group-icon {
        border: 3px solid transparent;
      }

      .group-icon:hover {
        border: 3px solid white;
      }

      .group-icon-selected {
        border: 3px solid transparent;
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

      .logo {
        width: 500px;
        margin-top: -5%;
      }

      /* .logo {
      width: 80px;
      margin-top: -5%;
    } */

      .logo-container {
        position: absolute;
        text-align: center;
        cursor: pointer;
        top: 20px;
        left: 20px;
        width: 80px;
        height: 80px;
        /* background-color: #04004eff; */
        border-radius: 20%;
        /* box-shadow: 2px 2px 2px black; */
      }

      .logo-container:hover {
        background-color: #818cae69;
      }

      .menu-item {
        background: #abb5d61b;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 45px;
        border-radius: 15px;
        padding: 15px;
        color: #9098b3;
        min-width: 150px;
        cursor: pointer;
        margin: 0 4px;
      }

      .menu-item:hover {
        background: #abb5d638;
        border-radius: 15px;
        padding: 15px;
        color: #9098b3;
        min-width: 150px;
        cursor: pointer;
        margin: 0 4px;
      }

      .menu-item-selected {
        background: #abb5d671;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 45px;
        border-radius: 15px;
        padding: 15px;
        color: #9098b3;
        min-width: 150px;
        cursor: pointer;
        margin: 0 4px;
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

      .wordcondenser-link {
        color: #929ab9;
        text-decoration: none;
        position: fixed;
        bottom: 10px;
        left: 20px;
        font-size: 1em;
        opacity: 0.8;
        cursor: pointer;
      }

      .wordcondenser-link:hover {
        color: #6978ff;
      }
    `,
  ];
}
