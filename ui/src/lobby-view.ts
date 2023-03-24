import { LitElement, html, css } from 'lit';
import { state, customElement, property } from 'lit/decorators.js';
import { encodeHashToBase64 } from '@holochain/client';
import { consume } from '@lit-labs/context';

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


import { condenserContext } from './contexts';
import { CondenserStore } from './condenser-store';
import { profilesStoreContext } from './lobby/profiles/context';
import { ProfilesStore } from './lobby/profiles/profiles-store';
import { LobbyStore } from './lobby-store';
import { LobbyInfo } from './types';
import { writeText } from '@tauri-apps/api/clipboard';

import './lobby/profiles/elements/edit-profile';
import { localized, msg } from '@lit/localize';
import { StoreSubscriber } from '@holochain-open-dev/stores';


export enum LobbyViewMode {
  Home,
  EditProfile,
  LeaveGroup,
}


@localized()
@customElement('lobby-view')
export class LobbyView extends LitElement {

  @consume({ context: condenserContext })
  @state()
  _condenserStore!: CondenserStore;

  @consume({ context: profilesStoreContext, subscribe: true })
  @state()
  _store!: ProfilesStore;

  // @property({ type: Object })
  // lobbyCellId!: CellId;

  @property({ type: Object })
  lobbyStore!: LobbyStore;

  @property({ type: Object })
  lobbyInfo: LobbyInfo | undefined;

  @state()
  _viewMode: LobbyViewMode = LobbyViewMode.Home;

  private _myProfile = new StoreSubscriber(this, () =>
    this._store.myProfile,
  );

  async leaveGroup() {
    try {
      await this._condenserStore.disableLobby(this.lobbyStore.service.cellId);
      this.dispatchEvent(new CustomEvent('request-home', {
        composed: true,
        bubbles: true,
      }));
      window.location.reload();
    } catch(e) {
      console.log("Failed to leave group: ", e);
      alert("Failed to leave group. See console for details.");
    }
  }

  invitationText() {
    return`
You have been invited to join a Word Condenser group!
(www.wordcondenser.com)

Enter this name an these secret words when joining the group:

Name:
${this.lobbyStore.lobbyName}

Secret words:
${this.lobbyInfo!.network_seed}


-----
#Holochain #ItsJustYouAndYourPeers #ButOnFire
`;
  }

  renderLeaveGroup() {
    return html`<div class="column" style="flex: 1; justify-content: center; align-items: center; margin-top: 100px;">
      <div
        style="font-size: 1.2em; font-weight: bold; color: #9098b3; max-width: 900px; text-align: left; margin-bottom: 50px;"
      >
        Confirm that you want to leave this group
      </div>
      <div
        class="column"
        style="font-size: 0.7em; color: #9098b3; max-width: 900px; text-align: left; margin-bottom: 50px; align-items: center;"
      >
        <div>
          Leaving the group means that you disable the corresponding cell in your Holochain conductor and you will
          stop synchronizing data with the network of peers this group forms together.<br><br>
          You will not lose any of the cravings that you have already installed and that this group
          kept track of but you will not see any new cravings this group adds to its index in the future.<br><br>
          You can re-enable the group later or permanently delete it by deleting the corresponding
          cell in the Holochain Launcher with the DNA hash<br><br>
        </div>

        <div style="text-align: center; background: #9098b333; font-family: 'Monospace'; padding: 5px; border-radius: 5px; margin-bottom: 40px;">${encodeHashToBase64(this.lobbyStore.service.cellId[0])}</div>
        <div>
          If you delete it permanently, you will not be able to ever join this group again <i>with this installation of the Word Condenser</i>.
          You would need to install another instance of the Word Condenser with another public key.
        </div>
      </div>

      <div class="row">
        <div
          class="row cancel-btn"
          style="align-items: center; margin-top: 5px; margin-right: 20px;"
          @click=${() => this._viewMode = LobbyViewMode.Home}
          @keypress=${() => this._viewMode = LobbyViewMode.Home}
          tabindex="0"
        >
          <span style="color: #cd2b2b; font-size: 23px;">${msg("Cancel")}</span>
        </div>

        <div
          class="row confirm-btn"
          style="align-items: center; margin-top: 5px;"
          @click=${async () => await this.leaveGroup()}
          @keypress=${async () => await this.leaveGroup()}
          tabindex="0"
        >
          <span style="color: #abb5d6; font-size: 23px;">Confirm</span>
        </div>
      </div>
    </div>
    `;
  }

  renderEditProfile() {
    switch (this._myProfile.value.status) {
      case "pending":
        return html`
      <div class="column center-content">
        <div style="font-size: 18px; color: #c5cded;">Profile still loading...</div>
      </div>s
      `;
      case "complete":
        return html`
          <div class="column" style="flex: 1; justify-content: center; align-items: center; margin-top: 100px;">
            <div
              style="font-size: 1.2em; font-weight: bold; color: #9098b3; max-width: 900px; text-align: left; margin-bottom: 50px;"
            >
              Update your profile:
            </div>
            <edit-profile
              allowCancel
              .saveProfileLabel=${msg("Save")}
              .profile=${this._myProfile.value.value}
              @cancel-edit-profile=${() => this._viewMode = LobbyViewMode.Home}
              @save-profile=${async (e: CustomEvent) => {
                  await this._store.client.updateProfile(e.detail.profile);
                  this._viewMode = LobbyViewMode.Home;
                }
              }
            ></edit-profile>
          </div>
        `;
      case "error":
        console.log("Error fetching profile: ", this._myProfile.value.error);
        return html`
        <div class="column center-content">
          <div style="font-size: 20px; color: #c5cded; font-weight: bold; margin-bottom: 30px;">Error:</div>
          <div style="font-size: 18px; color: #c5cded; font-weight: bold; margin-bottom: 30px;">
            ${this._myProfile.value.error}
          </div>
        </div>
        `;
    }
  }



  // This may only be called if lobbyInfo is not undefined
  renderMainSection() {
    return html`
      <button
        class="btn-back"
        @click=${
          () => this.dispatchEvent(new CustomEvent('request-home', {
            composed: true,
            bubbles: true,
          }))
        }
      >
        <div class="row" style="position: relative; align-items: center;">
          <span style="color: #ffd623ff; opacity: 0.68;">Back</span>
        </div>
      </button>

      <div style="position: absolute; top: 10px; right: 10px;">
        <my-profile id="my-profile" title="Your profile" style="cursor: pointer;" reactive @clicked-my-profile=${() => this._viewMode = LobbyViewMode.EditProfile}></my-profile>
      </div>

      <div slot="hero">
        <button
          class="btn-back"
          @click=${
            () => this.dispatchEvent(new CustomEvent('request-home', {
              composed: true,
              bubbles: true,
            }))
          }
        >
          <div class="row" style="position: relative; align-items: center;">
            <span style="color: #ffd623ff; opacity: 0.68;">Back</span>
          </div>
        </button>

        <div>
          <div class="column" style="align-items: center;">
            ${ this.lobbyInfo?.logo_src
              ? html`<img src=${this.lobbyInfo!.logo_src} style="height: 220px; width: 220px; border-radius: 25px; margin: 30px;" alt="Group logo"/>`
              : html `<div
                  class="column"
                  style="
                    height: 220px;
                    width: 220px;
                    border-radius: 25px;
                    background: #929ab9;
                    color: black;
                    font-size: 80px;
                    font-weight: bold;
                    justify-content: center;
                    align-items: center;
                  "
                  alt="Group logo placeholder"
                >
                  ${this.lobbyStore.lobbyName.slice(0,2)}
                </div>`
            }
            <div
              style="font-weight: bold; margin-top: 5px; font-size: 1.2em; color: #9098b3; margin-bottom: 30px;"
            >
              ${this.lobbyStore.lobbyName}
            </div>
            <div
              style="margin-bottom: 40px; font-size: 0.9em; color: #9098b3;"
            >
              You are new to this pack. Give yourself a shape!
            </div>
            <div style="border-radius: 30px; border: 1px solid #9098b3; margin-bottom: 45px; padding: 20px; background: #9098b31c">
              <div style="font-weight: bold; font-size: 0.8em; color: #9098b3; margin-bottom: 15px;">💡 Note:</div>
              <div
                style="font-size: 0.7em; color: #9098b3; max-width: 900px; text-align: left;"
              >
                This is Holochain and therefore peer-to-peer. Only the people in this group will ever be able to see the information that you add to your profile!<br><br>
                It is however totally okay if you feel more comfortable to start off with an imaginary name. You are free to update your profile and
                reveal more about yourself at any later point in time.<br><br>
                Your profile is only shared within this group that toghether tracks and hunts for cravings in the wild.
                Participating in a craving itself is inteded to be anonymous*.
              </div>
              <div style="font-size: 0.5em; color: #9098b3; max-width: 900px; text-align: left; margin-top: 50px;">
                *It is possible, with some coding effort to draw conclusions about the public key behind actions taken in a Craving and as
                a result of this potentially draw conclusions about the person that's behind that key. But frankly, who even wants to do that, given that it's
                so much more fun to just have it be something that emerges from our collective vapor without the need of knowing who wrote what exactly?
              </div>
            </div>

            <div
              style="font-size: 0.8em; font-weight: bold; color: #9098b3; max-width: 900px; text-align: left;"
            >
              Your Profile:
            </div>
          </div>
        </div>
      </div>

      <div class="column" style="align-items: center; flex: 1;">
        ${ this.lobbyInfo?.logo_src
          ? html`<img src=${this.lobbyInfo!.logo_src} style="height: 220px; width: 220px; border-radius: 25px; margin: 30px;" alt="Group logo"/>`
          : html `<img src="clock_blue.svg" style="height: 220px; width: 220px; border-radius: 25px; margin: 30px;" alt="Clock icon" title="Waiting for peers..."/>`
        }
        <div class="row" style="font-size: 1.5em; font-weight: bold; color: #9098b3; justify-content: center; align-items: center; margin-bottom: 50px;">
          <span>${this.lobbyStore.lobbyName}</span>
          <img
          src="copy_icon.svg"
          style="cursor: pointer; height: 30px; margin-left: 30px;"
          title="copy to clipboard"
          tabindex="0"
          alt="copy group name"
          @click=${() => writeText(this.lobbyStore.lobbyName)}
          @keypress=${() => writeText(this.lobbyStore.lobbyName)}
          />
        </div>

        ${ this.lobbyInfo
          ? html`
            <div style="margin-bottom: 8px;">
              <span style="color: #9098b3;">Secret words: </span>
            </div>
            <div class="row" style="font-size: 1em; color: #9098b3; justify-content: center; align-items: center; margin-bottom: 30px;">
              <span style="margin-left: 20px; border: 1px solid #9098b3; padding: 8px 16px; border-radius: 8px;">${this.lobbyInfo!.network_seed}</span>
              <img
                src="copy_icon.svg"
                style="cursor: pointer; height: 30px; margin-left: 10px;"
                title="copy to clipboard"
                tabindex="0"
                alt="copy secret words"
                @click=${() => writeText(this.lobbyInfo!.network_seed)}
                @keypress=${() => writeText(this.lobbyInfo!.network_seed)}
              />
            </div>
            <div
              class="row böttns"
              style="margin-bottom: 70px;"
              title="Click to copy the invitation to this group"
              tabindex="0"
              @click=${() => writeText(this.invitationText())}
              @keypress=${() => writeText(this.invitationText())}
            >
              <img
                src="copy_icon.svg"
                style="cursor: pointer; height: 30px; margin-left: 10px;"
                @click=${() => writeText(this.lobbyInfo!.network_seed)}
                @keypress=${() => writeText(this.lobbyInfo!.network_seed)}
              />
              <span style="color: #abb5d6; margin-left: 10px; font-size: 23px;">Copy Invitation</span>
            </div>
            <div style="font-weight: bold; color: #9098b3; margin-bottom: 20px; font-size: 0.9em;">Description:</div>
            <div style="max-width: 800px; text-align: left; color: #9098b3; font-size: 0.9em; margin-bottom: 70px;">
              ${this.lobbyInfo!.description}
            </div>
            ${
              this.lobbyInfo?.unenforced_rules
                ? html`
                  <div class="row" style="align-items: center; font-weight: bold; color: #9098b3; margin-bottom: 20px; font-size: 0.9em;">
                    <img src="rules.svg" style="height: 25px; margin-right: 10px;" />
                    <span>Unenforced Rules of the Group:</span>
                  </div>
                  <div style="max-width: 800px; text-align: left; color: #9098b3; font-size: 0.9em; margin-bottom: 70px;">
                    ${this.lobbyInfo!.unenforced_rules}
                  </div>`
                : html``
            }
            <div class="column" style="background: #9098b30e; align-items: center; width: 100vw; padding-bottom: 100px;">
            <div style="font-weight: bold; color: #9098b3; margin-bottom: 20px; font-size: 1em; margin-top: 50px;">Other Members:</div>
              <list-profiles></list-profiles>
            </div>
          `
          : html`
            <div style="margin-bottom: 8px; max-width: 800px; margin-bottom: 150px; margin-top: 40px;">
              <span style="color: #9098b3;">Could not get Group meta data from peers yet. At least one other group member
              needs to be online at the same time in order to synchronize data.</span>
            </div>
          `
        }

      </div>
  `
  }


  renderWaitingForPeers() {

  }

  renderContent() {
    switch (this._viewMode) {
      case LobbyViewMode.Home:
        return this.renderMainSection();
      case LobbyViewMode.EditProfile:
        return this.renderEditProfile();
      case LobbyViewMode.LeaveGroup:
        return this.renderLeaveGroup();
    }
  }

  render() {
    if (this._viewMode == LobbyViewMode.LeaveGroup) {
      return html`${this.renderLeaveGroup()}`
    }
    return html`
      <div
        class="cancel-btn"
        style="position: fixed; bottom: 0; right: 0; color: #cd2b2b; margin: 10px; display: flex; align-items: center;"
        @click=${() => this._viewMode = LobbyViewMode.LeaveGroup}
        @keypress=${() => this._viewMode = LobbyViewMode.LeaveGroup}
        tabindex="0"
      >
        <span style="margin-right: 10px;" >Leave Group</span>
        <img src="exit_red.svg" style="height: 30px;" />
      </div>

      <profile-prompt
        style="display: flex; flex: 1; overflow-y: auto;"
      >
       ${this.renderContent()}
      </profile-prompt>

    `;
  }

  static styles = [
    sharedStyles,
    css`

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

      .btn-back:hover {
        background-color: #ffd7231c;
      }


      .böttns {
        background: transparent;
        border-radius: 10px;
        padding: 8px;
        cursor: pointer;
      }

      .böttns:hover {
        background: #abb5d638;
        border-radius: 10px;
        padding: 8px;
      }

      .leave-btn {
        background: transparent;
        border-radius: 10px;
        padding: 20px 25px;
        cursor: pointer;
      }

      .leave-btn:hover {
        background: #9e1e1e56;
        border-radius: 10px;
        padding: 20px 25px;
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

    `
  ];


}
