import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import {
  AppAgentWebsocket,
  CellId,
  decodeHashFromBase64,
  DnaHash,
  encodeHashToBase64,
} from '@holochain/client';
import { provide } from '@lit-labs/context';
import '@material/mwc-circular-progress';
import { invoke } from '@tauri-apps/api';

import { get, StoreSubscriber } from '@holochain-open-dev/stores';
import { decodeEntry } from '@holochain-open-dev/utils';
import { open } from '@tauri-apps/api/shell';
import { UnlistenFn, listen } from '@tauri-apps/api/event';
import { clientContext, condenserContext } from './contexts';
import { DashboardMode, LobbyInfo } from './types';
import { CondenserStore } from './condenser-store';
import { sharedStyles } from './sharedStyles';

import { CravingDnaProperties } from './condenser/types';

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
import './lobby-context';
import './lobby/create-lobby';
import './lobby/join-lobby';
import './lobby/all-lobbies';
import './lobby/all-craving-recipes';
import './lobby/profiles/elements/profile-prompt';
import './lobby/profiles/elements/profiles-context';
import './lobby/profiles/elements/list-profiles';
import './lobby/profiles/elements/my-profile';
import './lobby-view';
import './intro';
import './no-cookies-ever';
import './loading-animation';

@customElement('holochain-app')
export class HolochainApp extends LitElement {
  @state() loading = true;

  @state() _dashboardMode = DashboardMode.Home;

  @state() _selectedCravingCellId: CellId | undefined = undefined;

  @state() _selectedLobbyCellId: CellId | undefined = undefined;

  @state() _selectedCraving: CravingDnaProperties | undefined = undefined;

  @state() _menuItem: 'cravings' | 'groups' = 'cravings';

  @state() _cravingMenuItem: 'installed' | 'available' | 'disabled' =
    'installed';

  @state()
  _unlisten: UnlistenFn | undefined;

  @provide({ context: clientContext })
  @property({ type: Object })
  client!: AppAgentWebsocket;

  @provide({ context: condenserContext })
  @property({ type: Object })
  store!: CondenserStore;

  private _allCravings = new StoreSubscriber(this, () =>
    this.store ? this.store.getAllInstalledCravings() : undefined,
  );

  private _allAvailableCravings = new StoreSubscriber(this, () =>
    this.store ? this.store.getAvailableCravings() : undefined,
  );

  private _allDisabledCravings = new StoreSubscriber(this, () =>
    this.store ? this.store.getAllDisabledCravings() : undefined,
  );

  private _allLobbyDatas = new StoreSubscriber(this, () =>
    this.store ? this.store.getAllLobbyDatas() : undefined,
  );

  private _activeGroupFilter = new StoreSubscriber(this, () =>
    this.store ? this.store.activeGroupFilter() : undefined,
  );

  disconnectedCallback(): void {
    if (this._unlisten) this._unlisten();
  }

  async firstUpdated() {
    // We pass '' as url because it will dynamically be replaced in launcher environments
    this.client = await AppAgentWebsocket.connect('', 'word-condenser');
    this.store = await CondenserStore.connect(this.client);

    if ((window as any).__HC_KANGAROO__) {
      window.addEventListener('focus', async () => {
        await invoke('clear_systray_icon', {});
      });

      //   console.log("Detected kangaroo environment.");
      //   this._unlisten = await listen("deep-link-received", async (e) => {
      //     const deepLink = e.payload as string;
      //     try {
      //       const split = deepLink.split("://");
      //       const split2 = split[1].split("/");

      //       if (split2[0] === "hrl") {
      //         await this.handleOpenHrl(
      //           decodeHashFromBase64(split2[1]),
      //           decodeHashFromBase64(split2[2])
      //         );
      //       } else if (split2[0] === "group") {
      //         await this.handleOpenGroup(split2[1]);
      //       }
      //     } catch (e) {
      //       console.error(e);
      //       notifyError(msg("Error opening the link."));
      //     }
      //   });
    }

    // check where to route after refresh
    const previousDashboardMode = window.localStorage.getItem(
      'previousDashboardMode',
    );

    // setInterval(async () => await this.store.fetchStores(), 10000);

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

          case 'CreateLobbyView':
            this._dashboardMode = DashboardMode.Home;
            break;

          case 'CreateCravingView':
            this._dashboardMode = DashboardMode.Home;
            break;

          case 'JoinLobbyView':
            this._dashboardMode = DashboardMode.Home;
            break;

          case 'Settings':
            this._dashboardMode = DashboardMode.Settings;
            break;

          case 'NoCookiesEVER':
            this._dashboardMode = DashboardMode.NoCookiesEVER;
            break;

          case 'CravingView': {
            const retrievedCravingDnaHash = decodeHashFromBase64(
              window.localStorage.getItem('selectedCravingDnaHash') as string,
            );
            this._selectedCravingCellId = [
              retrievedCravingDnaHash,
              this.client.myPubKey,
            ];
            this._selectedCraving = JSON.parse(
              window.localStorage.getItem('selectedCraving') as string,
            );
            this._dashboardMode = DashboardMode.CravingView;
            break;
          }

          case 'LobbyView': {
            const retrievedLobbyDnaHash = decodeHashFromBase64(
              window.localStorage.getItem('selectedLobbyDnaHash') as string,
            );
            this._selectedLobbyCellId = [
              retrievedLobbyDnaHash,
              this.client.myPubKey,
            ];
            this._dashboardMode = DashboardMode.LobbyView;
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

    let selectedCravingDnaHash: string;

    switch (this._dashboardMode) {
      case DashboardMode.Home:
        window.localStorage.setItem('previousDashboardMode', 'Home');
        window.location.reload();
        break;

      case DashboardMode.CreateLobbyView:
        window.localStorage.setItem('previousDashboardMode', 'Home');
        window.location.reload();
        break;

      case DashboardMode.JoinLobbyView:
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
        selectedCravingDnaHash = encodeHashToBase64(
          this._selectedCravingCellId![0],
        );
        window.localStorage.setItem(
          'selectedCravingDnaHash',
          selectedCravingDnaHash,
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
        window.location.reload();
        break;

      case DashboardMode.LobbyView: {
        const selectedLobbyDnaHash = encodeHashToBase64(
          this._selectedLobbyCellId![0],
        );
        window.localStorage.setItem(
          'selectedLobbyDnaHash',
          selectedLobbyDnaHash,
        );
        window.localStorage.setItem('previousDashboardMode', 'LobbyView');
        window.location.reload();
        break;
      }

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

  amISelected(lobbyDnaHash: DnaHash): boolean {
    if (this._activeGroupFilter.value) {
      console.log(
        '@amISelected: encodeHashToBase64(this._activeGroupFilter.value): ',
        encodeHashToBase64(this._activeGroupFilter.value),
      );
      console.log(
        '@amISelected: encodeHashToBase64(lobbyDnaHash): ',
        encodeHashToBase64(lobbyDnaHash),
      );

      return (
        encodeHashToBase64(this._activeGroupFilter.value) ===
        encodeHashToBase64(lobbyDnaHash)
      );
    }

    return false;
  }

  renderWelcome() {
    return html` <div class="column" style="align-items: center;">
      <div style="color: #abb5da; margin-bottom: 30px; font-size: 25px;">
        You are not part of any group yet. Join an existing group or create a
        new one.
      </div>

      <div class="row" style="align-items: center;">
        <button
          @click=${() => {
            this._dashboardMode = DashboardMode.JoinLobbyView;
          }}
          class="btn-create-lobby"
        >
          <div
            class="row"
            style="position: relative; align-items: center;"
            title="Join an existing Group that tracks Cravings out there"
          >
            <span style="color: #ffd623ff; opacity: 0.85;">Join Group</span>
          </div>
        </button>

        <button
          @click=${() => {
            this._dashboardMode = DashboardMode.CreateLobbyView;
          }}
          class="btn-create-lobby"
        >
          <div
            class="row"
            style="position: relative; align-items: center;"
            title="Create a new Group to track Cravings out there"
          >
            <span style="color: #ffd623ff; opacity: 0.85;">Create Group</span>
          </div>
        </button>
      </div>
    </div>`;
  }

  renderBottom() {
    return html``;
  }

  renderCravingTypes() {
    switch (this._cravingMenuItem) {
      case 'installed':
        return html`
          <div
            id="content"
            class="column"
            style="align-items: flex-start; width: 100%;"
          >
            <all-cravings
              id="all-cravings"
              @selected-craving=${(e: CustomEvent) => {
                this._selectedCravingCellId = e.detail.cellId;
                this._selectedCraving = e.detail.craving;
                this._dashboardMode = DashboardMode.CravingView;
              }}
            >
            </all-cravings>
          </div>
        `;
      case 'disabled':
        return html`
          <div
            id="content"
            class="column"
            style="align-items: flex-start; width: 100%;"
          >
            <all-disabled-cravings></all-disabled-cravings>
          </div>
        `;
      case 'available':
        return html`
          <div
            id="content"
            class="column"
            style="align-items: flex-start; width: 100%;"
          >
            <all-available-cravings
              @installed-craving=${(e: CustomEvent) => {
                this._selectedCravingCellId = e.detail.cellId;
                this._selectedCraving = e.detail.craving;
                this._dashboardMode = DashboardMode.CravingView;
                this.handleRefresh();
              }}
            ></all-available-cravings>
          </div>
        `;
      default:
        return html`Unknown Craving type`;
    }
  }

  renderCravings() {
    return html`
      <div
        class="row"
        style="margin-bottom: 30px; width: 100%; justify-content: flex-start; margin-left: 10px;"
      >
        <div
          tabindex="0"
          class=${this._cravingMenuItem === 'installed'
            ? 'menu-item-selected'
            : 'menu-item'}
          @click=${() => {
            this._cravingMenuItem = 'installed';
          }}
          @keypress=${() => {
            this._cravingMenuItem = 'installed';
          }}
          style="font-size: 0.8em;"
        >
          Installed (${this._allCravings.value.size})
        </div>
        <div
          title="Cravings that are tracked by at least one of your groups but that you don't have installed"
          tabindex="0"
          class=${this._cravingMenuItem === 'available'
            ? 'menu-item-selected'
            : 'menu-item'}
          @click=${() => {
            this._cravingMenuItem = 'available';
          }}
          @keypress=${() => {
            this._cravingMenuItem = 'available';
          }}
          style="font-size: 0.8em;"
        >
          Available (${this._allAvailableCravings.value.length})
        </div>
        <div
          title="Cravings that you have installed in your conductor but that are disabled"
          tabindex="0"
          class=${this._cravingMenuItem === 'disabled'
            ? 'menu-item-selected'
            : 'menu-item'}
          @click=${() => {
            this._cravingMenuItem = 'disabled';
          }}
          @keypress=${() => {
            this._cravingMenuItem = 'disabled';
          }}
          style="font-size: 0.8em;"
        >
          Disabled (${Object.values(this._allDisabledCravings.value).length})
        </div>

        <span style="display: flex; flex: 1;"></span>

        <div
          class="row"
          style="width: 100%; justify-content: flex-end; margin-right: 50px; position: relative;"
        >
          ${this._allLobbyDatas.value.map(
            lobbyData => html`
              <div class="column" style="align-items: center;">
                ${lobbyData.info && lobbyData.info.logo_src
                  ? html`
                      <img
                        src=${lobbyData.info.logo_src}
                        title="Click to filter/unfilter by Group '${lobbyData.name}'"
                        class="group-icon"
                        alt="Icon of group with name ${lobbyData.name}"
                        tabindex="0"
                        style="
                      height: 70px;
                      width: 70px;
                      border-radius: 50%;
                      margin-right: 2px;
                      cursor: pointer;
                      ${this.amISelected(lobbyData.dnaHash)
                          ? 'border: 3px solid white;'
                          : ''}
                    "
                        @keypress=${(e: KeyboardEvent) =>
                          e.key === 'Enter'
                            ? this.store.filterByGroup(lobbyData.dnaHash)
                            : undefined}
                        @click=${() =>
                          this.store.filterByGroup(lobbyData.dnaHash)}
                      />
                    `
                  : html`
                      <div
                        class="column group-icon ${this.amISelected(
                          lobbyData.dnaHash,
                        )
                          ? 'group-icon-selected'
                          : ''}"
                        style="
                      justify-content: center;
                      height: 70px;
                      width: 70px;
                      border-radius: 50%;
                      background: #929ab9;
                      font-size: 40px;
                      font-weight: bold;
                      margin-right: 2px;
                      color: black;
                      cursor: pointer;
                      ${this.amISelected(lobbyData.dnaHash)
                          ? 'border: 3px solid white;'
                          : ''}
                    "
                        title="Click to filter/unfilter by Group '${lobbyData.name}'"
                        tabindex="0"
                        alt="Icon of group with name ${lobbyData.name}"
                        @keypress=${(e: KeyboardEvent) =>
                          e.key === 'Enter'
                            ? this.store.filterByGroup(lobbyData.dnaHash)
                            : undefined}
                        @click=${() =>
                          this.store.filterByGroup(lobbyData.dnaHash)}
                      >
                        <span>${lobbyData.name.slice(0, 2)}</span>
                      </div>
                    `}
              </div>
            `,
          )}

          <div
            class="row"
            style="position: absolute; top: -45px; right: 10px; align-items: center;"
          >
            <img
              src="filter_filled.svg"
              alt="Filter icon"
              style="height: 30px; margin: 3px; margin-right: 8px;"
              title="Filter Cravings by Group"
            />
            <span style="color: #929ab9; font-size: 20px;"
              >filter by Group</span
            >
          </div>
        </div>
      </div>

      ${this.renderCravingTypes()}
    `;
  }

  renderGroups() {
    return html`
      <div
        id="content"
        class="column"
        style="align-items: center; width: 100%; margin-top: 90px;"
      >
        <all-lobbies
          id="all-lobbies"
          @selected-lobby=${(e: CustomEvent) => {
            this._selectedLobbyCellId = e.detail.cellId;
            this._dashboardMode = DashboardMode.LobbyView;
            window.scrollTo(0, 0);
          }}
        >
        </all-lobbies>
      </div>
    `;
  }

  renderDashBoard() {
    return html`
      <div class="row" style="margin-bottom: 30px;">
        <div
          class=${this._menuItem === 'cravings'
            ? 'menu-item-selected'
            : 'menu-item'}
          @click=${() => {
            this._menuItem = 'cravings';
          }}
          @keypress=${() => {
            this._menuItem = 'cravings';
          }}
          tabindex="0"
        >
          Cravings
        </div>
        <div
          class=${this._menuItem === 'groups'
            ? 'menu-item-selected'
            : 'menu-item'}
          @click=${() => {
            this._menuItem = 'groups';
          }}
          @keypress=${() => {
            this._menuItem = 'groups';
          }}
          tabindex="0"
        >
          Groups
        </div>
      </div>
      ${this._menuItem === 'groups' ? this.renderGroups() : undefined}
      ${this._menuItem === 'cravings' ? this.renderCravings() : undefined}
    `;
  }

  renderHome() {
    const lobbies = get(this.store.getAllLobbies());
    const disabledLobbies = get(this.store.getDisabledLobbies());

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

            <div class="row left-buttons">
              <button
                @click=${() => {
                  this._dashboardMode = DashboardMode.JoinLobbyView;
                }}
                @keypress=${() => {
                  this._dashboardMode = DashboardMode.JoinLobbyView;
                }}
                class="btn-join-group"
              >
                <div
                  class="row"
                  style="position: relative; align-items: center;"
                  title="Join an existing Group that tracks Cravings out there"
                >
                  <span style="color: #ffd623ff; opacity: 0.85;"
                    >Join Group</span
                  >
                </div>
              </button>
              <button
                @click=${() => {
                  this._dashboardMode = DashboardMode.CreateLobbyView;
                }}
                @keypress=${() => {
                  this._dashboardMode = DashboardMode.CreateLobbyView;
                }}
                class="btn-join-group"
              >
                <div
                  class="row"
                  style="position: relative; align-items: center;"
                  title="Create a new Group to track Cravings out there"
                >
                  <span style="color: #ffd623ff; opacity: 0.85;"
                    >Create Group</span
                  >
                </div>
              </button>
            </div>

            ${!(
              lobbies.size === 0 && Object.values(disabledLobbies).length === 0
            )
              ? html`
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
                `
              : html``}
            ${lobbies.size === 0 && Object.values(disabledLobbies).length === 0
              ? this.renderWelcome()
              : this.renderDashBoard()}
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
              this._selectedCravingCellId = undefined;
              this._selectedCraving = undefined;
            }}
            .cravingCellId=${this._selectedCravingCellId}
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
              this._selectedCravingCellId = undefined;
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
                this._selectedCraving = e.detail.cravingDnaProperties;
                this._selectedCravingCellId = e.detail.cravingCellId;
                this._dashboardMode = DashboardMode.CravingView;
                this.handleRefresh();
              }}
            ></create-craving>
          </div>
        `;
      // #################  CreateLobbyView  #######################
      case DashboardMode.CreateLobbyView:
        return html`
          <button
            @click=${() => {
              this._dashboardMode = DashboardMode.Home;
              this._selectedCravingCellId = undefined;
              this._selectedCraving = undefined;
            }}
            class="btn-back"
          >
            <div class="row" style="position: relative; align-items: center;">
              <span style="color: #ffd623ff; opacity: 0.68;">Back</span>
            </div>
          </button>
          <div style="margin-top: 20px;">
            <create-lobby
              @lobby-created=${() => {
                this._dashboardMode = DashboardMode.Home;
              }}
            ></create-lobby>
          </div>
        `;
      // #################  JoinLobbyView  #######################
      case DashboardMode.JoinLobbyView:
        return html`
          <button
            @click=${() => {
              this._dashboardMode = DashboardMode.Home;
              this._selectedCravingCellId = undefined;
              this._selectedCraving = undefined;
            }}
            class="btn-back"
          >
            <div class="row" style="position: relative; align-items: center;">
              <span style="color: #ffd623ff; opacity: 0.68;">Back</span>
            </div>
          </button>
          <div style="margin-top: 20px;">
            <join-lobby
              @lobby-joined=${() => {
                window.location.reload();
              }}
            ></join-lobby>
          </div>
        `;
      // #################  LobbyView  #######################
      case DashboardMode.LobbyView: {
        const [lobbyStore, profilesStore] = this.store.lobbyStore(
          this._selectedLobbyCellId![0],
        );
        const lobbyInfoRecord = lobbyStore.lobbyInfo;
        const lobbyInfo: LobbyInfo | undefined = lobbyInfoRecord
          ? decodeEntry(lobbyInfoRecord)
          : undefined;

        return html`
          <profiles-context .store=${profilesStore}>
            <lobby-view
              @profile-created=${this.handleRefresh}
              @request-home=${() => {
                this._dashboardMode = DashboardMode.Home;
                this._selectedLobbyCellId = undefined;
              }}
              .lobbyStore=${lobbyStore}
              .lobbyInfo=${lobbyInfo}
            ></lobby-view>
          </profiles-context>
        `;
      }

      // #################  Settings  #######################
      case DashboardMode.Settings:
        return html`
          <button
            @click=${() => {
              this._dashboardMode = DashboardMode.Home;
              this._selectedCravingCellId = undefined;
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

          <a
            class="wordcondenser-link"
            href="https://www.wordcondenser.com"
            target="_blank"
            >www.wordcondenser.com</a
          >

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
              @keypress=${() => {
                window.localStorage.removeItem('intro-seen');
                this.requestUpdate();
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
              @click=${() =>
                open('https://github.com/matthme/wordcondenser/issues/new')}
              @keypress=${() =>
                open('https://github.com/matthme/wordcondenser/issues/new')}
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
        return html`You found the bromm closet`;
    }
  }

  render() {
    if (this.loading) return html` <loading-animation></loading-animation> `;

    return html`
      <main>
        ${window.localStorage.getItem('intro-seen') || true
          ? this.renderHome()
          : html`<intro-section
              @intro-finished=${() => this.requestUpdate()}
            ></intro-section>`}
        ${(this._dashboardMode !== DashboardMode.Settings &&
          window.localStorage.getItem('intro-seen')) ||
        true
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
          : ``}
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
