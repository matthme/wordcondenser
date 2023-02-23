import { consume } from "@lit-labs/context";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { IconButton } from "@scoped-elements/material-web";

import { profilesStoreContext } from "../context";
import { ProfilesStore } from "../profiles-store";
import { ProfileDetail } from "./profile-detail";
import { UpdateProfile } from "./update-profile";
import { sharedStyles } from "@holochain-open-dev/elements";
import { StoreSubscriber } from "@holochain-open-dev/stores";
import { Profile } from "../types";
import { localized, msg } from "@lit/localize";

/**
 * @element profile-detail
 */
@localized()
@customElement('my-profile')
export class MyProfile extends ScopedElementsMixin(LitElement) {
  /** Dependencies */

  /**
   * @internal
   */
  @consume({ context: profilesStoreContext, subscribe: true })
  @state()
  _store!: ProfilesStore;

  /** Private properties */

  /**
   * @internal
   */
  private _myProfile = new StoreSubscriber(this, () =>
    this._store.myProfile,
  );

  @property()
  reactive: boolean = false;


  handleClick() {
    this.dispatchEvent(new CustomEvent('clicked-my-profile', {
      composed: true,
      bubbles: true,
    }));
  }


  renderProfile(profile: Profile | undefined) {
    if (!profile)
    return html`<div
      class="column"
      style="align-items: center; justify-content: center; flex: 1;"
    >
      <span class="placeholder"
        >${msg("This agent hasn't created a profile yet")}</span
      >
    </div>`;

  return html`
    <div
      class="row profile"
      style="align-items: center; justify-content: flex-start;"
      tabindex="0"
      @click=${this.handleClick}
      @keypress=${this.handleClick}
    >
      ${
        profile.fields["avatar"]
        ? html`<img style="height: 70px; width: 70px; border-radius: 20px;" src=${profile.fields["avatar"]}>`
        : html`<div style="height: 70px; width: 70px; border-radius: 20px; background: #c5cded"></div>`
      }
      <span style="font-size: 23px; color: #c5cded; margin-left: 20px;">${profile.nickname}</span>
    </div>
    `;
  }

  render() {
    switch (this._myProfile.value.status) {
      case "pending":
        return html`
      <div class="column center-content">
        <div style="font-size: 18px; color: #c5cded;">loading...</div>
      </div>s
      `;
      case "complete":
        return this.renderProfile(this._myProfile.value.value);
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

  /**
   * @ignore
   */
  static get scopedElements() {
    return {
      "mwc-icon-button": IconButton,
      "profile-detail": ProfileDetail,
      "update-profile": UpdateProfile,
    };
  }

  static styles = [sharedStyles,
    css`

      .profile {
        border-radius: 15px;
        padding: 10px;
        cursor: pointer;
        margin: 5px;
      }

      .profile:hover {
        background: #c5cded38;
      }

  `];
}
