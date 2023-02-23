import { LitElement, html, css } from 'lit';
import { state, customElement, property, query } from 'lit/decorators.js';
import { AppAgentClient, CellId, encodeHashToBase64, DnaHash, DnaHashB64, decodeHashFromBase64 } from '@holochain/client';
import { consume } from '@lit-labs/context';

import '@material/mwc-circular-progress';

import './condenser/craving-detail';
// import './condenser/reflection/create-reflection';
// import './condenser/reflection/reflections-for-craving';
// import './condenser/offer/create-offer';
// import './condenser/offer/offers-for-craving';
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
import { CravingDnaProperties } from './condenser/types';
import { AssociationMap } from './condenser/association-map';


import { clientContext, condenserContext } from './contexts';
import { CondenserStore } from './condenser-store';
import { getNickname } from './utils';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import { localized, msg } from '@lit/localize';
import { decodeEntry } from '@holochain-open-dev/utils';
import { LobbyInfo } from './types';



export enum CravingViewMode {
  Home,
  ShareRhyme,
  ShareSelection,
  DisableCraving,
}

@localized()
@customElement('craving-view')
export class CravingView extends LitElement {
  @consume({ context: clientContext })
  client!: AppAgentClient;

  @consume({ context: condenserContext })
  store!: CondenserStore;

  @property({ type: Object })
  cravingCellId!: CellId;

  @property({ type: Object })
  craving!: CravingDnaProperties;

  @query("#association-map")
  associationMap!: AssociationMap;

  @state()
  showDescription: boolean = true;

  @state()
  myNickName!: string;

  @state()
  sortOffersBy: 'latest' | 'resonanceTimeRatio' | 'resonanceAbsolute' = 'resonanceAbsolute';

  @state()
  sortAssociationsBy: 'latest' | 'resonanceTimeRatio' | 'resonanceAbsolute' = 'resonanceAbsolute';

  @state()
  _selectedLobbies: DnaHashB64[] = [];

  @state()
  private _viewMode: CravingViewMode = CravingViewMode.Home;

  private _lobbiesForCraving = new StoreSubscriber(
    this,
    () => this.store.getLobbiesForCraving(this.cravingCellId[0]),
  );

  private _allLobbies = new StoreSubscriber(
    this,
    () => this.store.getAllLobbies(),
  );

  firstUpdated() {
    // deterministically derive "random" name from public key and craving title
    this.myNickName = getNickname(this.cravingCellId[1], this.craving.title);
  }

  handleSelectionClick(dnaHash: DnaHash) {
    const hashString = encodeHashToBase64(dnaHash);
    if (this._selectedLobbies.includes(hashString)) {
      const index = this._selectedLobbies.indexOf(hashString);
      this._selectedLobbies.splice(index, 1);
      (this.shadowRoot?.getElementById(hashString) as HTMLElement).classList.remove("selected");
    } else {
      this._selectedLobbies.push(hashString);
      (this.shadowRoot?.getElementById(hashString) as HTMLElement).classList.add("selected");
    }
    this.requestUpdate();
  }

  async shareCraving() {
    try {
      const dnaHashes = this._selectedLobbies.map((b64hash) => decodeHashFromBase64(b64hash));
      await this.store.shareCraving(this.cravingCellId, dnaHashes);
      this._viewMode = CravingViewMode.Home;
    } catch (e) {
      throw new Error(`Failed to share craving: ${JSON.stringify(e).slice(100)}`);
    }
  }

  async disableCraving() {
    try {
      await this.store.disableCraving(this.cravingCellId);
      window.location.reload();
    } catch (e) {
      alert("Failed to disable craving. See console for details.");
      throw new Error(`Failed to share craving: ${JSON.stringify(e).slice(100)}`);
    }
  }


  renderDisableCraving() {
    return html`<div class="column" style="flex: 1; justify-content: center; align-items: center; margin-top: 100px;">
      <div
        style="font-size: 1.2em; font-weight: bold; color: #9098b3; max-width: 900px; text-align: left; margin-bottom: 50px;"
      >
        Confirm that you want to disable this craving
      </div>
      <div
        class="column"
        style="font-size: 0.7em; color: #9098b3; max-width: 900px; text-align: left; margin-bottom: 50px; align-items: center;"
      >
        <div>
          Disabling the Craving means that you disable the corresponding cell in your Holochain conductor and you will
          stop synchronizing data with the network of peers this craving forms together.<br><br>
          You can re-enable the Craving later or permanently delete it by deleting the corresponding
          cell in the Holochain Launcher with the DNA hash<br><br>
        </div>

        <div style="text-align: center; background: #9098b333; font-family: 'Monospace'; padding: 5px; border-radius: 5px; margin-bottom: 40px;">${encodeHashToBase64(this.cravingCellId[0])}</div>
        <div>
          If you delete it permanently, you will not be able to ever join this craving again <i>with this installation of the Word Condenser</i>.
          You would need to install another instance of the Word Condenser with another public key.
        </div>
      </div>

      <div class="row">
        <div
          class="row cancel-btn"
          style="align-items: center; margin-top: 5px; margin-right: 20px;"
          @click=${() => this._viewMode = CravingViewMode.Home}
          @keypress=${() => this._viewMode = CravingViewMode.Home}
          tabindex="0"
        >
          <span style="color: #cd2b2b; font-size: 23px;">${msg("Cancel")}</span>
        </div>

        <div
          class="row confirm-btn"
          style="align-items: center; margin-top: 5px;}"
          @click=${async () => await this.disableCraving()}
          @keypress=${async () => await this.disableCraving()}
          tabindex="0"
        >
          <span style="color: #abb5d6; font-size: 23px;">Disable</span>
        </div>
      </div>
    </div>
    `;
  }


  renderShareSelection() {

    const allLobbies = Array.from(this._allLobbies.value.entries());

    // filter out the ones this craving is already shared with
    console.log("allLobbies dna hashes: ", allLobbies.map(([dnaHash, _]) => encodeHashToBase64(dnaHash)));
    console.log("_lobbiesForCraving dna hashes: ", this._lobbiesForCraving.value.map((lobbyData) => encodeHashToBase64(lobbyData.dnaHash)));


    const remainingLobbies = allLobbies.filter(([dnaHash, _]) => {
      return !this._lobbiesForCraving.value.map((lobbyData) => encodeHashToBase64(lobbyData.dnaHash)).includes(encodeHashToBase64(dnaHash));
    })

    if (remainingLobbies.length === 0 ) {
      return html`
        <div class="column" style="flex: 1; justify-content: center; align-items: center; height: 100vh;">
          <div style="font-size: 1em; color: #9098b3; margin-bottom: 100px;">You already shared this craving with every group!</div>
          <div
            class="row confirm-btn"
            style="align-items: center; margin-top: 5px;"
            tabindex="0"
            @click=${() => this._viewMode = CravingViewMode.Home}
            @keypress=${() => this._viewMode = CravingViewMode.Home}
          >
            <span style="color: #abb5d6; font-size: 23px; margin: 0 10px;">Ok</span>
          </div>
        </div>
      `;
    }
    return html`
      <div class="column" style="flex: 1; justify-content: center; align-items: center; margin-top: 100px;">
        <div style="font-size: 1.1em; color: #9098b3; margin-bottom: 30px;">Select group to share it with:</div>

        <div
          class="column"
          style="
            max-width: 800px;
            height: 300px;
            overflow-y: auto;
            border: 1px solid #c5cded;
            border-radius: 10px;
            padding: 12px 10px;
        ">
          ${
            remainingLobbies.map(([lobbyDnaHash, [lobbyStore, _profilesStore]]) => {
              const lobbyInfo = decodeEntry(lobbyStore.lobbyInfo!) as LobbyInfo;
              return html`
                <div
                  id=${encodeHashToBase64(lobbyDnaHash)}
                  class="group-selection-element"
                  @click=${() => this.handleSelectionClick(lobbyDnaHash)}
                  @keypress=${() => this.handleSelectionClick(lobbyDnaHash)}
                  tabindex="0"
                >
                  <!-- <div style="height: 60px; width: 60px; background: lightgreen; border-radius: 20%; margin-left: 15px;"></div> -->
                  <img src=${lobbyInfo.logo_src} style="height: 60px; width: 60px; border-radius: 20%; margin-left: 15px;" />
                  <div
                    style="
                      margin-left: 30px;
                  ">
                    ${lobbyStore.lobbyName}
                  </div>

                </div>
              `
            })
          }
        </div>

        <div class="row" style="margin-top: 50px;">
          <div
            class="row cancel-btn"
            style="align-items: center; margin-top: 5px; margin-right: 20px;"
            @click=${() => this._viewMode = CravingViewMode.Home}
            @keypress=${() => this._viewMode = CravingViewMode.Home}
            tabindex="0"
          >
            <span style="color: #cd2b2b; font-size: 23px;">${msg("Cancel")}</span>
          </div>

          <div
            class="row confirm-btn"
            style="align-items: center; margin-top: 5px;"
            tabindex="0"
            @click=${async () => await this.shareCraving()}
            @keypress=${async () => await this.shareCraving()}
          >
            <img src="send_icon.svg" style="height: 27px;" alt="meditating person" />
            <span style="color: #abb5d6; font-size: 23px; margin-left: 10px;">Share!</span>
          </div>
        </div>

      </div>
    `;
  }


  renderShareRhyme1() {
    return html`
      <div class="column" style="flex: 1; justify-content: center; align-items: center; margin-top: 100px;">
        <div
          style="font-size: 1.4em; font-weight: bold; color: #9098b3; max-width: 900px; text-align: left; margin-bottom: 50px;"
        >
          Sharing is Caring
        </div>
        <div
          class="column"
          style="font-size: 0.85em; line-height: 1.4em; color: #9098b3; max-width: 900px; text-align: center; margin-bottom: 50px; align-items: center;"
        >
          As you see, those cravings -<br>
          and especially the juicy ones,<br><br>

          can propagate without constraints<br>
          along our lines of social bonds.<br><br>

          So if you share one with a group of yours<br>
          shaping language, is what you do!<br><br>

          So be wise and do take care,<br>
          making sure to only share,<br>
          what indeed you want to hear out there!
        </div>

        <div class="row">
          <div
            class="row cancel-btn"
            style="align-items: center; margin-top: 5px; margin-right: 20px;"
            @click=${() => this._viewMode = CravingViewMode.Home}
            @keypress=${() => this._viewMode = CravingViewMode.Home}
            tabindex="0"
          >
            <span style="color: #cd2b2b; font-size: 23px;">${msg("Cancel")}</span>
          </div>

          <div
            class="row confirm-btn"
            style="align-items: center; margin-top: 5px;}"
            tabindex="0"
            @click=${() => this._viewMode = CravingViewMode.ShareSelection}
            @keypress=${() => this._viewMode = CravingViewMode.ShareSelection}
          >
            <img src="meditating.svg" style="height: 30px;" alt="meditating person" />
            <span style="color: #abb5d6; font-size: 23px; margin-left: 10px;">I feel calm and ready to share</span>
          </div>
        </div>
      </div>
    `;
  }


  renderShareRhyme2() {
    return html`
      <div class="column" style="flex: 1; justify-content: center; align-items: center; margin-top: 100px;">
        <div
          style="font-size: 1.4em; font-weight: bold; color: #9098b3; max-width: 900px; text-align: left; margin-bottom: 70px; margin-top: -30px;"
        >
          Sharing is Caring
        </div>
        <img src="symphony.svg" style="width: 500px;" alt="a sketch of a web of nodes with connections where each node is a filter and beautiful music is being emitted from the web as whole" />
        <div
          class="column"
          style="margin-top: 50px;font-size: 0.85em; line-height: 1.4em; color: #9098b3; max-width: 900px; text-align: center; margin-bottom: 50px; align-items: center;"
        >
          You are a filter in our collective web we form<br>
          (for scientists: You shape with me our Fourier transorm)<br><br>

          let's have it then the way we want,<br>
          each one of us lets through just this,<br>
          we want the world to see, it is.<br><br>

          And consequently we will see,<br>
          how all together - who would have thought? -<br>
          we play one breathtaking symphony.<br>
        </div>

        <div class="row" style="margin-bottom: 100px;">
          <div
            class="row cancel-btn"
            style="align-items: center; margin-top: 5px; margin-right: 20px;"
            @click=${() => this._viewMode = CravingViewMode.Home}
            @keypress=${() => this._viewMode = CravingViewMode.Home}
            tabindex="0"
          >
            <span style="color: #cd2b2b; font-size: 23px;">${msg("Cancel")}</span>
          </div>

          <div
            class="row confirm-btn"
            style="align-items: center; margin-top: 5px;}"
            tabindex="0"
            @click=${() => this._viewMode = CravingViewMode.ShareSelection}
            @keypress=${() => this._viewMode = CravingViewMode.ShareSelection}
          >
            <img src="violine.svg" style="height: 40px;" alt="meditating person" />
            <span style="color: #abb5d6; font-size: 23px; margin-left: 10px;">Let's pull that string!</span>
          </div>
        </div>
      </div>
    `;
  }

  renderHome() {
    return html`
      <button
        @click=${() => this.dispatchEvent(new CustomEvent('back-home', {
          bubbles: true,
          composed: true,
        }))}
      class="btn-back"
      style="position: fixed; top: 10px; left: 10px;"
      >
        <div class="row" style="position: relative; align-items: center;">
          <span style="color: #ffd623ff; opacity: 0.68;">Home</span>
        </div>
      </button>

      <div class="column" style="align-items: center; flex: 1; width: 100%; margin-bottom: 80px;">
        <div class="row top-bar">

          <div style="color: #929ab9; font-size: 40px; font-weight: bold; margin-left: 170px; text-align: left;">
            ${this.craving.title}
          </div>
          <span style="display: flex; flex: 1;"></span>

          <div style="margin-right: 20px;">
            <div
            class="row btn-collapse"
            style="${this.showDescription ? "display: none;" : ""}"
            @click=${() => this.showDescription = !this.showDescription}
            >
              <span style="font-size: 20px;">show description</span>
            </div>
          </div>

          <div class="column" style="align-items: flex-end; margin-right: 10px; margin-top: 10px;">
            <div title="Yes, that's you!" style="font-size: 23px; color: #e06208; margin-bottom: 10px;">${this.myNickName}</div>
            <div title="We don't want to interfere,\nwith our collective atmosphere.\nBeing here is gift itself,\nno need to brag -\nnor to promote yourself!" style="font-size: 15px; width: 200px; text-align: right; color: #abb5d6;">your random nickname for this craving</div>
          </div>


        </div>

        <div class="craving-description row" style="${this.showDescription ? "": "display: none;"}">
          <div style="margin-left: 185px; margin-right: 70px;">${this.craving.description}</div>
        </div>

        <div style="margin-top: 20px; margin-bottom: 10px; ${this.showDescription ? "": "display: none;"}">
          <div
            class="row btn-collapse"
            @click=${() => this.showDescription = !this.showDescription}
          >
            <span
              style="font-size: 20px;"
            >collapse description</span>
          </div>
        </div>

        <div class="row" style="width: 100%; justify-content: flex-end; margin-right: 50px;">
          ${this._lobbiesForCraving.value.map((lobbyData) => {
            if (lobbyData.info && lobbyData.info.logo_src) {
              return html`
                <img
                  src=${lobbyData.info.logo_src}
                  title="shared with '${lobbyData.name}'"
                  alt="Icon of group with name ${lobbyData.name}"
                  style="height: 70px; width: 70px; border-radius: 50%; margin: 3px;"
                />
              `
            }
            return html`
              <div
                class="column"
                style="justify-content: center; height: 70px; width: 70px; border-radius: 50%; background: #929ab9; font-size: 40px; font-weight: bold; margin: 3px; color: black;"
                  title="shared with '${lobbyData.name}'"
                  alt="Icon of group with name ${lobbyData.name}"
                >
                <span>${lobbyData.name.slice(0,2)}</span>
              </div>
              `
            }
          )}

          <img
            src="share_icon.svg"
            class="icon"
            style="height: 60px; width: 60px; cursor: pointer; margin: 3px;"
            title="Share with another group"
            @keypress.enter=${() => this._viewMode = CravingViewMode.ShareRhyme}
            @click=${() => this._viewMode = CravingViewMode.ShareRhyme}
          >

        </div>

        <div class="row" style="overflow-x: auto; width: 100%;">

          <div class="column box" style="flex-shrink: 0; width: 475px; margin-left: 20px;">
          <div class="row" style="align-items: center; margin: 18px 10px 30px 23px;">
              <img src="associations.svg" style="height: 80px;">
              <div
                style="font-size: 34px; margin-left: 10px; color: #ffc64cff;"
                title="What tickles your mind? Keep it short."
              >Associations</div>
            </div>
            <create-association .cravingCellId=${this.cravingCellId}></create-association>
            <div class="row" style="justify-content: flex-end; margin-right: 20px;">
              <span
                class=${this.sortAssociationsBy === "latest" ? "order-selector-selected" : "order-selector"}
                @click=${() => this.sortAssociationsBy = "latest"}
              >latest</span>
              <span
                class=${this.sortAssociationsBy === "resonanceAbsolute" ? "order-selector-selected" : "order-selector"}
                @click=${() => this.sortAssociationsBy = "resonanceAbsolute"}
              >most drops</span>
            </div>
            <association-map id="association-map" .cravingCellId=${this.cravingCellId} .sortBy=${this.sortAssociationsBy}></association-map>
          </div>

          <div class="column box" style="flex-shrink: 0; width: 850px; padding: 10px;">
            <div class="row" style="align-items: center; margin: 18px 10px 35px 10px;">
              <img src="reflections.svg" style="height: 65px;">
              <div
                style="font-size: 34px; margin-left: 10px; color: #ffc64cff;"
                title="Any thoughts about the topic? Explore untapped philosohical realms."
              >Reflections</div>
            </div>
            <create-reflection  .cravingCellId=${this.cravingCellId}></create-reflection>
            <all-reflections .cravingCellId=${this.cravingCellId}></all-reflections>
          </div>

          <div class="column box" style="flex-shrink: 0; width: 495px;">
            <div class="row" style="align-items: center; margin: 30px 10px 30px 23px;">
              <img src="offers.svg" style="height: 65px;" title="drip drop...">
              <div
                style="font-size: 34px; margin-left: 10px; color: #ffc64cff;"
                title="Got a precious drop of liquified grammatical potential? Share it, make it real!"
              >Offers</div>
            </div>
            <create-offer .cravingCellId=${this.cravingCellId}></create-offer>
            <div class="row" style="justify-content: flex-end; margin-right: 20px;">
              <span
                class=${this.sortOffersBy === "latest" ? "order-selector-selected" : "order-selector"}
                @click=${() => this.sortOffersBy = "latest"}
              >latest</span>
              <span
                class=${this.sortOffersBy === "resonanceAbsolute" ? "order-selector-selected" : "order-selector"}
                @click=${() => this.sortOffersBy = "resonanceAbsolute"}
              >most drops</span>
            </div>
            <all-offers id="all-offers" .cravingCellId=${this.cravingCellId} .sortBy=${this.sortOffersBy}></all-offers>

          </div>

        </div>

        <img
            class="icon"
            src="power_off.svg"
            style="height: 60px; position: fixed; bottom: 10px; right: 30px; cursor: pointer;"
            title="Disable Craving"
            tabindex="0"
            @click=${() => this._viewMode = CravingViewMode.DisableCraving}
            @keypress=${() => this._viewMode = CravingViewMode.DisableCraving}
        />
      </div>

    `
  }

  renderContent() {
    switch (this._viewMode) {
      case CravingViewMode.Home:
        return this.renderHome();
      case CravingViewMode.ShareRhyme:
        const randomBoolean = Math.random() < 0.5;
        if (randomBoolean) {
          return this.renderShareRhyme2();
        } else {
          return this.renderShareRhyme1();
        }
      case CravingViewMode.ShareSelection:
        return this.renderShareSelection();

      case CravingViewMode.DisableCraving:
        return this.renderDisableCraving();
    }
  }


  render() {
    return html`
      <craving-context .cravingCellId=${this.cravingCellId}>
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

    `
  ];


}
