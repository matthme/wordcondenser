import { LitElement, html, css } from 'lit';
import { state, customElement, property } from 'lit/decorators.js';
import { AppAgentClient, DnaHash, encodeHashToBase64, DnaHashB64, decodeHashFromBase64 } from '@holochain/client';
import { consume } from '@lit-labs/context';
import '@material/mwc-button';
import '@material/mwc-snackbar';
import { Snackbar } from '@material/mwc-snackbar';
import { v4 as uuidv4 } from "uuid";

import '@material/mwc-textfield';
import '@material/mwc-textarea';
import '../components/mvb-textfield';
import '../components/mvb-textarea';
import '../components/mvb-button';
import { sharedStyles } from '../sharedStyles';
import { CondenserStore } from '../condenser-store';
import { clientContext, condenserContext } from '../contexts';
import { classMap } from 'lit/directives/class-map.js';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import { DnaRecipe, LobbyInfo } from '../types';
import { decodeEntry } from '@holochain-open-dev/utils';
import { CravingDnaProperties } from './types';
import { MVBButton } from '../components/mvb-button';


const MAX_DESCRIPTION_CHARS = 10000;
const MAX_TITLE_CHARS = 80;

@customElement('create-craving')
export class CreateCraving extends LitElement {

  @consume({ context: clientContext })
  client!: AppAgentClient;

  @consume({ context: condenserContext })
  store!: CondenserStore;


  private _allLobbies = new StoreSubscriber(
    this,
    () => this.store.getAllLobbies(),
  );


  @state()
  _title: string | undefined;

  @state()
  _description: string | undefined;

  @state()
  _selectedLobbies: DnaHashB64[] = [];

  @state()
  _max_association_chars: number | null = null;

  @state()
  _max_offer_chars: number | null = null;

  @state()
  _max_reflection_chars: number | null = null;


  @state()
  installing: boolean = false;

  @state()
  onFire: boolean = false;


  isCravingValid() {
    return this._title !== undefined && this._title !== "" && this._title.length <= MAX_TITLE_CHARS
    && this._description !== undefined && this._description != "" && this._description.length <= MAX_DESCRIPTION_CHARS
    && this._selectedLobbies.length > 0;
  }

  titleTooLong() {
    return this._title ? this._title.length > MAX_TITLE_CHARS : false
  }

  descriptionTooLong() {
    return this._description ? this._description.length > MAX_DESCRIPTION_CHARS : false
  }

  async createCraving() {
    this.installing = true;
    (this.shadowRoot?.getElementById("create-craving-button") as MVBButton).disabled = true;

    // !! IMPORTANT !! Order of attributes matter in order to get the same DNA hash
    const cravingDnaProperties: CravingDnaProperties = {
        title: this._title!,
        description: this._description!,
        max_anecdote_chars: null,
        max_association_chars: this._max_association_chars,
        max_offer_chars: this._max_offer_chars,
        max_reflection_chars: this._max_reflection_chars,
    };

    // console.log("@create-craving: cravingDnaProperties: ", cravingDnaProperties);

    try {
      const networkSeed = uuidv4();
      const originTime = Date.now()*1000; // current epoch time in microseconds

      // create cell clone for this craving
      const clonedCell = await this.store.createCraving(
        cravingDnaProperties,
        networkSeed,
        originTime,
      );

      const dnaRecipe: DnaRecipe = {
        title: this._title!,
        network_seed: networkSeed,
        properties: cravingDnaProperties, // original poster has special rights on the Craving
        origin_time: originTime,
        membrane_proof: undefined,
        resulting_dna_hash: clonedCell.cell_id[0]
      };

      // console.log("Creating craving with recipe: ", dnaRecipe);

      // create an entry in each of the lobby cells to register that Craving there
      Promise.all(this._selectedLobbies.map(async (dnaHashB64) => {
        const [lobbyStore, _profilesStore] = this.store.lobbyStore(decodeHashFromBase64(dnaHashB64));
        try {
          await lobbyStore.service.registerCraving(dnaRecipe);
        } catch(e) {
          console.log("ERROR: ", JSON.stringify(e).slice(50));
          throw new Error(JSON.stringify(e));
        }
      }));

      this.dispatchEvent(new CustomEvent('craving-created', {
        composed: true,
        bubbles: true,
        detail: {
          cravingCellId: clonedCell.cell_id,
          cravingDnaProperties,
        }
      }));
      this.installing = false;
      (this.shadowRoot?.getElementById("create-craving-button") as MVBButton).disabled = true;
      // window.location.reload();
    } catch (e: any) {
      console.log("ERROR: ", e);
      const errorSnackbar = this.shadowRoot?.getElementById('create-error') as Snackbar;
      errorSnackbar.labelText = `Error creating the craving: ${e.data.data}`;
      errorSnackbar.show();

      this.installing = false;
      (this.shadowRoot?.getElementById("create-craving-button") as MVBButton).disabled = false;

    }
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
    // console.log("Clicked. Length of this._selectedLobbies: ", this._selectedLobbies.length);
    // console.log("content of this._selectedLobbies: ", this._selectedLobbies);
  }


  renderLobbyList() {

    const allLobbies = Array.from(this._allLobbies.value.entries());

    if (allLobbies.length === 0 ) {
      return html`<span style="font-size: 1em;">No Groups found. You need to be part of a group in order to add a Craving.</span>`
    }

    return html`

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
          allLobbies.map(([lobbyDnaHash, [lobbyStore, _profilesStore]]) => {
            const lobbyInfo = lobbyStore.lobbyInfo ? decodeEntry(lobbyStore.lobbyInfo) as LobbyInfo : undefined;

            return html`
              <div
                id=${encodeHashToBase64(lobbyDnaHash)}
                class="group-selection-element"
                @click=${() => this.handleSelectionClick(lobbyDnaHash)}
                @keypress=${() => this.handleSelectionClick(lobbyDnaHash)}
                tabindex="0"
              >
                <!-- <div style="height: 60px; width: 60px; background: lightgreen; border-radius: 20%; margin-left: 15px;"></div> -->
                ${ !!lobbyInfo
                  ? html`<img src=${lobbyInfo.logo_src} style="height: 60px; width: 60px; border-radius: 20%; margin-left: 15px;" />`
                  : html`<div style="background: #929ab9; height: 60px; width: 60px; border-radius: 20%; margin-left: 15px; font-size: 40px; font-weight: bold; color: black;" >${lobbyStore.lobbyName.slice(0,2)}</div>`
                }
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
    `
  }

  render() {
    return html`
      <mwc-snackbar id="create-error" leading>
      </mwc-snackbar>

      <div style="display: flex; flex-direction: column; align-items: center;">

        <div class="box">
          <div style="font-size: 40px; font-weight: bold; color: #abb5da; opacity: 0.85; margin-bottom: 30px; margin-top: 40px;">Add New Craving</div>
          <div style="font-size: 19px; line-height: 30px; color: #c5cded; margin-bottom: 50px; max-width: 800px; text-align: left;">
            This will create a <b>new peer-to-peer network</b> just for this very craving of yours. To have others discover it,
            you need to add it to at least one of your groups.<br><br>#Holochain
            <span
              style="cursor: default;"
              @mouseover=${() => this.onFire = true}
              @mouseout=${() => this.onFire = false}
              class=${classMap({
                red: this.onFire,
              })}
            >${this.onFire ? "#ButOnFire!!!" : "#ItsJustYouAndYourPeers"}</span>

          </div>

          <div style="margin-bottom: 15px;">
            <mvb-textfield
              style="
                --mvb-primary-color: #abb5d6;
                --mvb-secondary-color: #838ba4;
                --mvb-textfield-width: 800px;
                --mvb-textfield-height: 56px;
                margin-bottom: 15px;
              "
              placeholder="Title"
              @input=${(e: CustomEvent) => {
                this._title = (e.target as any).value;
              } }
              title="Give your craving a title"
            >
            </mvb-textfield>
          </div>

          <!-- <mwc-textfield outlined label="Title"  @input=${(e: CustomEvent) => { this._title = (e.target as any).value; } } required></mwc-textfield> -->
          <div style="margin-bottom: 15px;">
            <mvb-textarea
              style="
                --mvb-primary-color: #abb5d6;
                --mvb-secondary-color: #838ba4;
                margin-bottom: 30px;
              "
              @input=${(e: CustomEvent) => { this._description = (e.target as any).value;} }
              placeholder="Describe here what it is that you vaguely see - and are craving for part of our language to be..."
              title="Describe what it is that you want a word or expression for"
              cols=57
              rows=13
              width="760px"
              required
            ></mvb-textarea>
          </div>

          ${ this.titleTooLong()
            ? html`<div style="font-size: 19px; line-height: 30px; color: #ba3030; margin: 5px; max-width: 800px; text-align: left;">
                    Title is too long. Must be no more than ${MAX_TITLE_CHARS} characters.
                  </div>
              `
            : html``
          }

          ${ this.descriptionTooLong()
              ? html`<div style="font-size: 19px; line-height: 30px; color: #ba3030; margin: 5px; max-width: 800px; text-align: left;">
                    Description is too long. Must be no more than ${MAX_DESCRIPTION_CHARS} characters.
                  </div>
              `
            : html``
          }

          <div style="font-size: 19px; line-height: 30px; color: #c5cded; margin-bottom: 20px; margin-top: 80px; max-width: 800px; text-align: left;">
            Choose the group(s) you want this Craving to be discoverable for:
          </div>

          ${this.renderLobbyList()}


          <div style="font-size: 18px; line-height: 30px; color: #c5cded; margin-bottom: 50px; margin-top: 10px; max-width: 800px; text-align: left;">
            Note: You can always add this Craving to other groups later. But you need to choose at least one now.
          </div>

          <div style="margin-bottom: 10px;">
            <mvb-button
              id="create-craving-button"
              style="
                --mvb-primary-color: none;
                --mvb-secondary-color: #ffd7230e;
                --mvb-button-text-color: #ffd623ff;
                --mvb-button-disabled-text-color: #ffd72360;
                opacity: 0.85;
              "
              @click=${() => this.createCraving()}
              .disabled=${!this.isCravingValid() && !this.installing}
            >
              <div class="row" style="align-items: center;">
                <img src="empty_glass.svg" style="height: 50px;"/>
                <span style="margin-left: 12px;">${this.installing ? "creating..." : "Create Craving"}</span>
              </div>
            </mvb-button>
          </div>

        </div>

      </div>

      ${
        this.onFire
        ? html`
        <div style="position: fixed; bottom: -100px; left: 50%; transform: translate(-50%, 0);">
          <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
            width="1016px" height="493px" viewBox="0 0 1016 493" enable-background="new 0 0 1016 493" xml:space="preserve">
            <g>
                <path class="flame" fill-rule="evenodd" clip-rule="evenodd" fill="#F58553" d="M260.138,279.034c0.329,2.103,0.929,3.955,3.466,1.591
                    c1.36-1.269,2.555-2.34,2.946-4.48c0.611-3.344,1.288-6.88,4.965-9.637C262.791,267.109,258.981,271.64,260.138,279.034z"/>
                <path class="flame one" fill-rule="evenodd" clip-rule="evenodd" fill="#F58553" d="M642.133,261.121c-0.602,1.805,2.854,4.751,5.137,4.486
                    c2.775-0.322,5.049-1.429,4.986-4.831c-0.051-2.835-2.447-5.298-5.188-5.287C643.428,255.591,642.939,258.697,642.133,261.121z"/>
                <path class="flame two" fill-rule="evenodd" clip-rule="evenodd" fill="#F58553" d="M236.169,192.895c2.469-0.638,4.981-0.998,4.781-3.98
                    c-0.117-1.744-0.676-3.642-3.098-3.758c-2.766-0.133-4.256,1.769-4.511,3.915C233.163,190.574,234.413,192.402,236.169,192.895z"/>
                <path class="flame" fill-rule="evenodd" clip-rule="evenodd" fill="#F58553" d="M394.363,104.625c2.114,0.205,3.56-0.855,3.625-2.719
                    c0.057-1.631-1.206-2.715-3.106-2.809c-1.935-0.095-2.961,0.578-3.069,2.6C391.708,103.615,392.298,104.781,394.363,104.625z"/>
                <path class="flame one" fill-rule="evenodd" clip-rule="evenodd" fill="#F58553" d="M257.108,216.734c1.575,0.05,2.945-0.246,2.794-2.009
                    c-0.133-1.558-1.21-2.582-2.89-2.516c-1.492,0.059-2.595,1.087-2.394,2.435C254.774,215.686,255.437,217.224,257.108,216.734z"/>
                <path class="flame two" fill-rule="evenodd" clip-rule="evenodd" fill="#F58553" d="M73.648,152.806c1.225,0.057,1.942-0.5,2.374-1.896
                    c-0.912-0.418-0.55-1.965-2.227-2.114c-1.723-0.152-2.062,1.195-2.287,2.05C71.119,152.317,72.336,152.744,73.648,152.806z"/>
            </g>
            <g>
                <path class="flame one" fill-rule="evenodd" clip-rule="evenodd" fill="#DF513D" d="M217.934,126.101c-1.167-3.763-2.061-7.788-5.236-11.302
                    c0.108,2.457-0.002,4.26-0.827,5.933c-0.684,1.387-0.368,3.43-2.745,3.684c-2.311,0.248-3.482-0.874-4.668-2.691
                    c-3.922-6.005-2.688-12.452-1.678-18.786c0.745-4.666,2.17-9.221,3.387-14.22c-9.078,5.882-13.839,18.679-11.527,29.102
                    c2.305,10.385,6.331,19.888,12.472,28.634c7.29,10.382,7.329,20.787,0.019,30.697c2.168,0.269,3.337-0.783,4.553-1.723
                    c8.892-6.871,10.305-16.748,10.146-26.877C221.712,140.951,220.195,133.394,217.934,126.101z"/>
                <path class="flame one" fill-rule="evenodd" clip-rule="evenodd" fill="#DF513D" d="M537.457,199.138c-3.573,3.704-3.719,8.707-4.095,13.078
                    c-0.443,5.159,2.751,9.729,6.305,13.933c1.678-4.575,1.526-8.778-0.152-13.235C537.881,208.579,536.785,203.986,537.457,199.138z"
                    />
                <path class="flame two" fill-rule="evenodd" clip-rule="evenodd" fill="#DF513D" d="M790.553,136.011c-1.086-0.688-1.059,0.386-1.111,0.802
                    c-0.26,2.063-1.121,4.191,0.15,6.185c2.043,3.204,3.762,6.5,3.252,11.266c3.506-3.165,4.613-6.646,4.301-10.125
                    C796.799,140.311,793.68,137.989,790.553,136.011z"/>
                <path class="flame one" fill-rule="evenodd" clip-rule="evenodd" fill="#DF513D" d="M939.061,13.063c-2.963-0.039-4.814,2.08-4.898,5.601
                    c-0.365,3.134,2.238,3.978,4.217,4.556c2.504,0.733,5.953-2.514,5.951-5.005C944.33,15.513,941.861,13.101,939.061,13.063z"/>
                <path class="flame" fill-rule="evenodd" clip-rule="evenodd" fill="#DF513D" d="M553.012,173.176c-5.986,4.961-6.033,6.817-1.004,11.31
                    C555.391,181.12,551.922,177.398,553.012,173.176z"/>
            </g>
            <path class="flame-main one" fill-rule="evenodd" clip-rule="evenodd" fill="#DF513D" d="M855.631,466.945C944.262,471.891,972,449.18,972,449.18
                C1027,321.359,944.33,235,944.33,235c-25.416-5.286-45.699-63.5-49.117-88.546c-1.01-7.383,0.025-15.348,1.727-22.938
                c4.066-18.146,11.555-34.489,25.205-47.463c6.234-5.924,13.301-10.446,23.752-8.588c-14.379-8.771-28.559-10.971-43.646-6.452
                c-13.455,4.031-24.506,11.925-34.635,21.463c-10.742,10.116-19.926,21.219-25.68,34.991c-2.672,6.39-4.943,12.996-5.521,19.735
                c-0.764,8.926-0.973,18.003,0.777,26.961c1.719,8.808,4.424,17.371,8.691,25.153c5.264,9.596,10.76,18.952,14.289,29.435
                c3.588,10.658,5.154,21.481,3.627,32.481c-1.809,13.028-7.438,24.381-17.133,33.622c-7.992,7.619-16.848,7.064-23.23-1.906
                c-2.838-3.988-4.801-8.185-5.996-13.175c-2.541-10.627-1.035-20.107,5.604-28.506c7.814-9.888,11.92-20.496,9.221-33.241
                c-2.605-12.3-14.936-23.608-25.422-24.022c4.357,3.514,10.586,11.164,13.289,16.328c4.455,8.511,3.699,18.335-3.877,25.045
                c-5.648,5.003-10.664,10.654-14.902,17.021c-3.209,4.823-6.195,9.681-7.303,15.373c-0.564,2.904-0.221,5.978-0.387,8.969
                c-0.057,1.005,0.322,2.667-1.828,1.731c-5.561-2.418-9.982-6.14-10.158-14.216c-0.094-4.266,2.254-7.965,2.404-12.128
                c0.379-10.409-8.141-20.954-19.229-22.816c-10.182-1.711-18.287,2.746-23.861,14.147c2.469-0.808,4.727-1.556,6.992-2.286
                c2.447-0.789,4.965-0.24,7.432-0.234c7.539,0.02,14.816,8.159,13.32,16.086c-1.266,6.717-4.697,12.408-7.08,18.555
                c-4.266,10.991-10.574,21.106-14.582,32.256c-4.201,11.694-7.123,23.498-4.744,36.104c0.408,2.16,2.133,4.087,1.367,7.061
                c-7.738-8.408-16.045-15.436-25.604-20.918c-8.41-4.82-17.121-8.909-26.645-10.926c-2.17-0.459-3.08-1.602-3.496-3.445
                c-0.963-4.267-3.477-7.051-7.836-7.607c-4.699-0.601-7.273,2.641-9.066,6.234c-1.064,2.138-2.082,2.248-4.195,1.928
                c-15.563-2.355-27.02-11.037-35.943-23.396c-11.643-16.123-16.396-34.125-14.266-54.008c1.791-16.705,8.824-30.894,19.84-43.279
                c11.209-12.603,25.119-21.442,40.432-28.448c-0.35-0.178-0.529-0.323-0.73-0.361c-0.254-0.047-0.531-0.042-0.787,0.002
                c-19.779,3.385-45.439,14.517-59.5,31.411c-0.166,0.201-0.363,0.377-0.549,0.564c-4.191,4.213-7.574,9.034-10.373,14.242
                c-5.674,10.557-8.674,21.895-10.453,33.734c-1.299,8.649-1.73,17.34-0.422,25.789c1.697,10.957,5.266,21.479,10.924,31.289
                c5.309,9.2,11.873,17.521,17.426,26.535c2.143,3.479,1.92,6.092-1.285,8.326c-1.924,1.344-4.066,2.461-6.248,3.335
                c-6.979,2.798-14.191,2.927-21.504,1.562c-15.086-2.816-26.398-10.412-31.984-25.242c-4.852-12.872-3.498-25.889-0.332-38.765
                c3.709-15.087,9.834-29.463,13.641-44.539c3.434-13.596,6.252-27.32,7.219-41.325c0.73-10.567,0.684-21.164-0.883-31.693
                c-1.055-4.138-0.746-8.691-3.738-12.236c0.002,0,0.003,0.001,0.004,0.002c-0.072-4.321-2.307-7.884-4.096-11.609
                c-3.334-8.141-8.697-14.584-16.004-19.415c2.986,4.352,6.135,8.549,8.773,13.114c0.365,0.634,0.885,2.142,2.361,1.377
                c-0.141,4.219,3.092,7.335,3.691,11.312c-0.203,0.471-0.24,0.865,0.434,0.926c0,0-0.039,0.088-0.039,0.089
                c1.229,7.339,3.654,14.469,3.854,21.993c0.277,7.069-0.301,14.054-1.268,21.083c-1.262,9.162-3.033,18.159-5.955,26.918
                c-2.639,7.904-5.814,15.605-8.836,23.359c-3.461,8.881-7.283,17.65-10.363,26.707c-4.963,14.591-10.781,28.851-14.065,44.032
                c-3.851,17.809-2.452,34.576,6.944,50.396c0.892,1.5,1.322,3.014,1.411,4.791c0.607,12.178-6.601,21.589-20.336,22.445
                c-16.567,1.032-29.487-7.037-33.707-22.111c-2.169-7.747-1.702-15.574-0.003-23.352c3.305-15.127,10.624-28.352,19.604-40.729
                c4.995-6.886,8.435-14.472,9.014-22.863c1.204-17.457-5.281-31.88-19.167-42.561c-5.162-3.97-11.1-6.564-18.131-5.406
                c-11.898,1.959-15.779,14.669-16.513,26.118c1.964-2.698,3.785-5.37,5.781-7.906c3.604-4.581,8.707-5.385,13.817-4.151
                c13.203,3.188,19.3,17.235,12.706,28.876c-2.606,4.6-5.966,8.563-10.19,11.975c-5.143,4.15-9.367,9.452-14.577,13.502
                c-5.938,4.618-11.283,9.875-15.389,15.926c-5.288,7.796-11.634,13.953-20.057,17.894c-7.237,3.384-17.27,4.203-22.724-2.331
                c-4.678-5.603-4.442-12.041-2.223-18.393c6.571-18.801,14.331-37.188,18.802-56.705c2.512-10.964,3.926-22.005,3.771-33.219
                c-0.293-21.134-7.547-39.917-19.95-56.795c-3.735-5.083-7.982-9.791-12.397-15.161c-0.441,3.125,0.279,5.327,0.699,7.361
                c2.643,12.804,3.729,25.771,4.406,38.768c0.407,7.829-0.424,15.631-1.206,23.472c-1.115,11.184-3.351,21.955-7.212,32.455
                c-2.723,7.409-6.812,14.064-11.788,20.079c-4.364,5.276-9.939,9.478-16.148,12.21c-8.284,3.646-17.829-2.003-19.39-11.826
                c-2.665-16.773-0.41-32.809,9.74-47.062c-0.963-0.419-1.715,0.063-2.629,0.779c-7.514,5.889-14.286,12.32-19.609,20.456
                c-9.272,14.171-13.619,29.941-15.935,46.323c-1.771,12.528-3.694,24.94-7.695,36.989c-4.727,14.237-21.139,24.276-35.978,21.826
                c-9.413-1.554-15.849-7.425-20.69-15.005c-14.236-22.295-12.316-45.057-1.232-67.882c4.195-8.637,10.013-16.207,16.315-23.659
                c-12.587-1.713-22.69,2.739-31.15,11.041c-10.202,10.013-14.693,23.224-18.941,36.383c-0.987,3.055-1.763,2.217-3.276,1.01
                c-13.538-10.804-22.13-24.641-25.489-41.673c-0.5-3.099-0.999-6.198-1.498-9.298c0.1-11.729,1.626-23.235,5.648-34.413
                c-1.005,1.916-2.907,2.779-4.039,4.46c-13.677,20.313-16.274,43.052-14.618,66.643c0.372,5.296-0.561,10.181-2.291,14.941
                c-2.936,8.075-8.172,9.575-14.724,4.1c-4.525-3.783-8.732-8.006-12.714-12.367c-11.834-12.958-18.152-28.218-18.812-45.852
                c-0.748-19.978,4.404-38.725,11.956-56.868c8.639-20.756,11.392-41.894,6.258-63.94c-2.858-12.27-8.542-23.307-15.923-33.204
                c-3.85-5.163-8.923-9.78-14.618-13.434c-16.292-10.449-32.993-13.009-50.84-3.433c1.47,1.12,2.801,1.62,4.334,2.034
                c12.039,3.249,22.931,8.94,31.515,17.937c10.389,10.89,12.899,24.402,9.939,38.878c-2.776,13.572-7.482,26.616-12.908,39.293
                c-7.716,18.031-16.924,35.417-22.425,54.384c-2.498,8.614-4.16,17.295-4.617,26.232c-0.038,0.737-0.09,1.806-0.548,2.121
                c-1.022,0.704-1.664-0.424-2.182-1.073c-2.667-3.337-4.792-6.98-6.257-11.027c-5.234-14.466-3.651-28.882,0.609-43.142
                c2.264-7.577,5.338-14.913,8.438-23.433c-4.936,3.301-7.244,7.463-9.685,11.352c-11.064,17.624-13.31,37.145-10.991,57.244
                c1.626,14.097,6.347,27.808,5.391,42.253c-0.504,7.608-0.817,15.015-6.939,21.076c0,0-52.749,96.413-18.563,155.781
                c4.75,8.249,402.17,17.768,402.17,17.768c2.102,0,4.204-0.062,6.304-0.094c8.706-0.004,17.41-0.01,26.113-0.015
                c1.494-0.006,2.987-0.012,4.481-0.017c3.332-1.905,5.942-4.229,7.982-6.894c-2.039,2.664-4.65,4.988-7.981,6.894
                c6.079,0.004,12.159,0.008,18.237,0.011c1.445,0.039,2.889,0.113,4.333,0.114c74.932,0.005,149.866,0.012,224.799-0.001
                c27.342-0.005,54.686-0.057,82.025-0.088c16.762-0.006,53.166,0.087,54.609,0.087 M824.752,226.698c0,0.001,0.001,0.002,0.002,0.002
                c-0.02,0.195-0.037,0.39-0.055,0.584C824.717,227.09,824.734,226.894,824.752,226.698z M574.146,136.221
                c1.001,0.838,1.496,2.265,2.499,3.105C575.644,138.489,575.148,137.061,574.146,136.221z M47.543,347.683L47.543,347.683
                l0.125,0.123C47.618,347.757,47.542,347.682,47.543,347.683z"/>
            <path class="flame-main two" fill="#F26C52" d="M976.667,324.592c1.229,3.776,2.013,7.837,2.314,12.227c0,0,0.169-78.337-70.811-125.496
                c-12.488-10.562-22.174-23.317-29.328-37.979c-5.111-10.474-8.277-21.568-8.316-33.246c-0.061-17.212,5.729-32.611,15.887-46.398
                c4.676-6.347,9.795-12.306,16.17-17.068c0.813-0.606,1.436-1.467,2.709-2.8c-6.471,0.968-11.582,3.497-16.594,6.001
                c-12.121,6.057-21.768,15.038-29.004,26.446c-6.633,10.455-9.918,22.096-10.471,34.407c-0.984,21.887,5.711,41.839,15.961,60.806
                c5.223,9.667,11.035,19.048,12.852,30.185c3.426,20.996,1.273,40.842-11.291,58.79c-8.707,12.435-26.303,19.606-40.416,16.137
                c-9.441-2.322-14.35-9.342-17.363-17.764c-5.699-15.928-4.258-31.144,5.617-45.238c3.137-4.479,6.176-9.028,9.457-13.835
                c-4.576,1.163-16.156,14.673-20.363,23.321c-4.803,9.866-1.631,20.479-2.895,30.676c-10.527-3.265-23.447-14.418-21.99-27.205
                c0.559-4.914,0.131-9.867,1.447-14.806c1.6-5.992-1.145-11.556-6.531-14.658c-3.473-2.001-7.193-3.389-11.336-3.133
                c2.994,1.594,6.342,2.346,8.82,4.939c1.842,1.928,2.898,4.032,2.977,6.617c0.418,13.832-1.627,26.889-8.738,39.294
                c-8.867,15.469-13.41,32.414-12.527,50.462c0.334,6.838,2.555,13.077,7.289,18.236c8.326,9.069,9.984,20.421,5.266,31.396
                c-0.754,1.757-1.402,3.433-3.953,1.573c-11.662-8.503-23.174-17.189-33.09-27.736c-4.387-4.665-8.094-9.967-12.469-14.646
                c-8.01-8.57-18.422-11.793-29.779-13.402c-16.861-2.39-33.697-5.066-47.652-16.334c-9.074-7.328-15.014-16.762-19.492-27.226
                c-5.621-13.131-8.916-26.752-8.33-41.222c0.371-9.153,2.295-17.872,5.559-26.362c0.221-0.573,0.424-1.153,0.846-2.309
                c-2.08,0.743-2.357,2.227-2.844,3.376c-4.656,11.01-8.379,22.354-10.244,34.152c-1.172,7.397-0.301,14.827,1.813,22.155
                c3.832,13.296,10.604,25.058,18.066,36.521c3.5,5.377,7.021,10.748,10.359,16.227c5.326,8.736,2.068,19.219-7.029,24.131
                c-8.594,4.64-17.66,5.329-27.082,4.19c-0.625-0.076-1.277,0.081-1.918,0.13l-1.695-0.031c-4.563-1.718-9.17-3.33-13.684-5.174
                c-18.088-7.387-30.508-23.889-30.627-44.457c-0.076-12.859,3.195-24.85,6.871-36.87c3.832-12.531,7.818-25.016,11.65-37.546
                c0.715-2.342,1.018-4.81,0.652-7.516c-1.91,4.821-3.895,9.615-5.719,14.47c-5.123,13.62-10.459,27.169-15.178,40.93
                c-4.24,12.366-8.473,24.877-8.307,38.179c0.162,12.924,4.285,24.588,11.971,35.119c3.307,4.531,7.906,8.158,9.961,13.563
                c3.859,10.151,1.246,19.344-4.648,27.839c-10.016,14.438-24.234,17.849-40.832,15.78c-7.385-0.92-14.406-2.816-21.246-5.422
                c-13.549-5.159-20.191-16.348-23.844-29.433c-5.659-20.297-1.638-39.06,9.969-56.494c7.352-11.042,16.057-20.996,24.254-31.362
                c10.086-12.758,9.057-28.586-2.361-40.235c-5.086-5.189-10.006-10.389-17.781-11.482c-3.191-0.448-6.057-0.333-8.852,1.574
                c6.895-0.15,12.607,2.547,17.379,7.047c11.996,11.316,13.275,24.909,4.355,39.414c-4.842,7.876-10.643,15.015-17.059,21.489
                c-9.441,9.529-17.724,20.023-26.696,29.926c-7.03,7.757-15.354,14.125-26.103,15.848c-13.623,2.184-29.494-4.447-30.713-21.896
                c-0.891-12.764,2.373-24.592,7.247-36.053c4.003-9.414,8.815-18.479,12.995-27.823c5.777-12.917,6.504-26.398,4.506-40.307
                c-1.439-10.016-4.09-19.696-6.574-29.444c-0.232-0.908-0.518-1.76-1.363-2.299c-1.287,0.388-0.861,1.473-0.895,2.303
                c-0.65,16.369-3.062,32.494-6.676,48.451c-2.785,12.297-6.24,24.348-12.229,35.561c-6.266,11.733-15.305,19.604-28.64,22.453
                c-9.214,1.968-15.219-2.511-18.5-9.665c-5.24-11.428-6.019-23.727-4.448-36.16c0.309-2.44,0.587-4.884,1.013-8.444
                c-3.861,7.471-6.259,14.328-8.441,21.26c-4.343,13.795-5.548,28.134-7.463,42.374c-1.608,11.957-3.538,23.914-8.479,35.022
                l-15.857,20.554c-7.382,5.247-16.351,7.71-26.848,7.29c-8.636-0.345-15.731-4.848-21.172-11.485
                c-11.316-13.803-16.834-30.063-19.095-47.496c-1.957-15.088,2.089-29.289,7.337-43.214c1.781-4.724,4.593-8.914,7.143-13.301
                c-6.168,4.492-11.489,9.746-14.327,16.926c-3.176,8.032-5.8,16.283-8.966,24.32c-1.615,4.101-3.291,8.944-8.447,9.479
                c-4.833,0.5-7.611-3.513-10.353-6.885c-4.711-5.799-9.38-11.66-13.003-18.207c-5.151-9.312-7.396-19.474-8.453-30.011
                c-0.391-3.899-0.656-7.797-1.01-11.71c-2.149,14.851-3.22,29.688-0.711,44.639c0.993,5.913,1.636,11.873,0.565,17.956
                c-2.594,14.728-14.194,19.696-27.364,15.702c-17.352-5.263-28.268-17.412-35.249-33.595c-7.923-18.365-10.003-37.727-8.615-57.398
                c1.024-14.504,5.077-28.423,9.827-42.23c4.295-12.483,9.772-24.487,13.912-37.012c5.05-15.277,2.599-29.875-3.141-44.386
                c-2.809-7.1-6.498-13.438-12.36-18.428c-1.311-1.115-2.546-2.211-4.886-2.353c1.798,5.031,3.791,9.689,5.134,14.529
                c5.293,19.076,2.46,37.394-5.948,54.979c-4.234,8.854-9.156,17.38-13.41,26.226c-9.552,19.863-15.102,40.924-18.531,62.641
                c-1.506,9.536-2.45,19.081-2.274,29.927c-8.867-10.378-16.602-20.101-23.522-30.626c1.123,6.077,2.47,12.124,3.324,18.239
                c2.06,14.749,4.544,29.489,1.258,44.428c0,0-16.868-12.046-33.307,36.978c-1.356,4.042-2.709,8.499-4.049,13.412
                c7.755-5.54,11.074-12.951,11.394-22.115c0.022-0.625,0.141-1.246,0.313-2.696c1.795,1.347,3.208,2.806,4.3,4.374
                C6.589,401.313,52,444,52,444c156.805,14.154,296.961,20.449,417.648,22.161c1.765,0.024,3.536,0.051,5.292,0.074
                c148.598,1.953,267.32-3.039,350.782-8.784c1.064-0.073,2.109-0.146,3.162-0.221C918.027,451.008,966,444,966,444
                C987.153,425.667,981.715,361.088,976.667,324.592z"/>
            <path class="flame-main three" opacity="0.8" fill-rule="evenodd" clip-rule="evenodd" fill="#F58553" d="M771.154,453.647c4.645,0,9.287-0.143,13.924-0.219
                c-25.818-16.325-17.105-41.962-15.551-65.757c-3.521,0.37-4.951,3.345-7.004,5.331c-9.867,9.548-14.1,23.04-21.363,34.415
                c-9.449,14.788-17.018,14.925-25.93-0.033c-2.594-4.349-4.225-4.217-7.916-1.868c-10.408,6.618-19.42,5.279-28.299-3.677
                c-6.129-6.184-10.113-14.14-15.355-21.021c-4.699-6.163-5.984-12.75-6.344-20.355c-0.447-9.584,2.104-18.817,1.871-28.303h-0.004
                c-7.65,5.511-10.27,14.52-13.883,22.757c-4.41,10.053-5.74,21.149-9.033,31.565c-2.633,8.33-7.711,14.427-17.234,13.855
                c-7.832-0.471-14.918-6.768-17.174-15.797c-0.881-3.54-1.301-7.207-1.984-10.808c-2.359-12.411-11.273-21.867-23.324-24.362
                c1.521,3.162,3.078,5.966,4.262,8.938c4.434,11.113-0.098,23.483-10.412,28.778c-9.416,4.826-20.078,0.569-25.262-10.763
                c-6.271-13.727-8.491-27.745-2.084-42.451c7.385-16.953,15.694-33.557,19.432-52.057c3.805-18.83,8.199-37.641,3.057-56.968
                c-1.508-5.663-3.047-11.502-8.219-15.116c0.531,22.308-1.311,43.79-8.566,64.439c-1.611,4.588-3.866,9.898-9.258,9.653
                c-5.247-0.24-7.363-5.582-8.916-10.199c-2.825-8.413-3.985-17.262-5.019-26.269c-4.696,8.833-7.067,18.028-7.695,27.979
                c-1.67,26.497,4.661,52.582,3.425,78.977c-0.796,17.018-4.039,33.424-16.239,46.251c-5.652,5.94-12.339,8.128-19.831,6.946
                c-6.515-1.03-4.905-8.176-6.835-12.499c-4.691-10.52-11.012-18.682-21.919-21.827c0.271,2.51,1.212,4.334,2.184,6.135
                c6.913,12.791,3.335,26.492-9.141,34.971c-7.763,5.282-16.252,2.058-24.763-9.902c-6.272-8.814-11.438-18.625-18.38-26.764
                c-9.283-10.887-10.386-22.944-9.229-36.673c0.895-10.597,2.159-21.221,3.135-32.339c-2.998,1.271-3.42,3.53-4.264,5.351
                c-5.396,11.639-6.326,24.707-10.429,36.752c-2.34,6.871-4.194,14.084-10.652,18.427c-5.743,3.861-10.957-0.137-17.543-1.849
                c1.996,5.225,1.941,9.44,1.948,13.668c0.009,7.597-3.437,12.981-9.719,16.052c-5.165,2.525-10.896,3.367-15.631-0.757
                c-5.439-4.732-5.102-11.494-3.413-17.886c2.614-9.902,3.342-19.96,2.588-30.076c-0.898-12.045-4.308-23.276-11.323-35.221
                c-1.936,26.202-12.987,46.158-23.798,66.063c-7.771,14.31-20.111,22.571-35.3,26.102c-22.3,5.179-45.063-7.87-52.903-30.214
                c-1.833-5.219-3.105-10.955-10.035-15.357c3.337,6.592,2.699,11.838,2.615,16.988c-0.199,12.348-11.01,19.681-21.815,14.888
                c-9.322-4.138-10.708-13.066-11.149-22.081c-1.051-21.541,2.433-42.76,4.431-64.095c1.699-18.137,1.618-36.25-5.224-53.447
                c-2.413-6.063-4.379-12.723-11.311-16.911c1.208,6.781,2.867,12.603,3.185,18.511c1.202,22.357-3.821,43.814-9.484,65.079
                c-1.724,6.481-6.069,9.843-12.894,10.153c-19.101,0.858-33.916-9.88-45.649-22.92c-12.052-13.398-19.873-30.782-23.049-49.766
                c-2.322-13.875-5.463-27.539-10.073-40.819c-6.375-18.363-12.479-28.436-23.091-35.713c12.643,22.768,18.38,45.825,16.469,70.755
                c-0.113,1.458,0.528,2.991,0.863,4.478c6.375,28.472,19.533,53.678,33.731,78.371c4.063,7.069,6.331,14.761,4.842,22.824
                c-3.339,18.082-11.792,33.119-25.715,44.48c-0.109,0.245-0.177,0.536-0.345,0.72c-0.098,0.107-0.362,0.044-0.551,0.057
                c0.301-0.259,0.602-0.52,0.902-0.776c0.272-11.404,0.781-22.873-7.828-32.517c-3.199,11.496-7.804,18.17-22.956,32.627
                c0,0-20.409,7.137,13.348,20.188C104.064,462.01,446.695,479.899,771.154,453.647z"/>
            <path class="flame-main three" opacity="0.8" fill-rule="evenodd" clip-rule="evenodd" fill="#F58553" d="M956.425,464.105
                c-283.913,0.026-436.816-4.843-720.731-4.854c-5.471,0-10.94-0.17-16.414-0.259c17.521-8.644,29.516-19.407,35.464-33.646
                c3.527,1.396,5.092,3.325,7.317,4.926c35.38,25.433,78.727,21.837,116.905,6.063c14.958-6.18,25.563-14.081,20.298-26.71
                c18.336,1.768,30.708,6.852,38.003,16.78c6.811,9.263,17.117,9.926,28.419,2.379c5.181-3.462,7.175-7.52,7.832-12.224
                c0.825-5.903-5.177-10.447-8.612-16.018c8.262,0.587,12.618,3.027,17.026,5.416c14.347,7.771,24.313,17.255,30.903,28.102
                c6.558,10.787,18.213,18.85,37.52,20.972c41.72,4.582,96.563-11.861,105.411-41.25c5.203-17.268,12.443-34.365,27.301-49.779
                c6.971-7.235,13.938-14.741,30.017-19.136c-3.498,5.18-6.355,8.919-8.574,12.789c-7.594,13.236-11.873,26.498-0.401,39.853
                c10.145,11.811,28.792,13.81,45.402,4.956c15.291-8.153,17.729-17.783,6.95-29.903c21.625,3.47,31.868,10.7,37.656,20.952
                c4.237,7.505,10.585,8.833,22.368,4.999c11.688-3.803,17.802-10.277,21.734-17.517c6.505-11.979,9.623-24.293,9.09-36.918
                c-0.286-6.807-0.097-13.664-8.294-19.234c-0.917-1.19-1.835-2.38-2.734-3.569c25.02,6.119,30.716,20.096,37.163,33.489
                c3.832,7.955,5.298,16.313,8.674,24.361c1.394,3.321,3.512,7.423,10.355,8.059c6.925,0.642,11.047-2.916,13.649-5.935
                c18.472-21.417,25.072-43.195,3.656-65.466c-13.239-22.289-10.814-43.785,9.086-64.394l-0.168-0.118
                c0.767,11.759-5.291,23.314-0.978,35.305c3.61,10.039,9.313,19.199,18.593,27.751c7.567,6.975,13.455,14.467,16.165,22.727
                c0.994,3.797,1.986,7.59,2.982,11.382c-0.127,5.22-0.251,10.438-0.38,15.66c-5.04,9.903-10.8,19.7-14.889,29.741
                c-3.156,7.76,0.219,14.943,12.113,19.614C963.82,417.971,967.399,461.364,956.425,464.105z"/>
          </svg>
        </div>
        `
        : html``
      }

      `;
  }

  static styles = [sharedStyles,
    css`
      .red {
        color: #ff5630;
      }

      .box {
      /* border: 2px solid #ffc64c94; */
        border-radius: 25px;
        margin: 10px;
        padding: 10px 70px;
        background: #fff6e309;
      }

      .group-selection-element {
        display: flex;
        flex-direction: row;
        align-items: center;
        font-size: 19px;
        color: #98a3cf;
        min-height: 90px;
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


      .mo-fire {
        height: auto;
        position: fixed;
        left:20%;
        bottom: -50px;
        z-index: 4;
      }

      #svg-view {
        width: 252px;
        height: 125px;
        left: 0px;
      }

      .mo-fire svg {
        width: 100%;
        height: auto;
        position:relative;
        right:40px;
      }
      .flame {
        animation-name: flameDisappear;
        animation-duration: 2s;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
        opacity: 0.5;
        transform-origin: 45% 45% 0;
      }
      .flame.one {
        animation-delay: 1s;
        animation-duration: 3s;
      }
      .flame.two{
        animation-duration: 5s;
        animation-delay: 1s;
      }


      .flame-main {
        animation-name: flameMovement;
        animation-duration: 2s;
        animation-timing-function: ease-in-out;
        animation-iteration-count: infinite;
      }
      .flame-main.one {
        animation-duration: 2.2s;
        animation-delay: 1s;
      }
      .flame-main.two {
        animation-duration: 2s;
        animation-delay: 1s;
      }
      .flame-main.three {
        animation-duration: 2.1s;
        animation-delay: 3s;
      }
      .flame-main.four {
        animation-duration: 3.2s;
        animation-delay: 4s;
      }
      .flame-main.five {
        animation-duration: 2.5s;
        animation-delay: 5s;
      }
      @keyframes flameMovement {
        50% {
          transform: scale(0.98,1.0) translate(0, 2px) rotate(-1deg);
        }
      }
      @keyframes flameDisappear {
        0%{
          transform: translate(0) rotate(180deg);
        }
        50% {
          opacity: 1;
        }
        100% {
          transform: translate(-10px, -40px) rotate(180deg);
          opacity: 0;
        }
      }
    `
  ]
}

