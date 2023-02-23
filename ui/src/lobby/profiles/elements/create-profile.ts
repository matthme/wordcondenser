import { html, LitElement } from "lit";
import { state } from "lit/decorators.js";
import { consume } from "@lit-labs/context";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { Card } from "@scoped-elements/material-web";

import { ProfilesStore } from "../profiles-store";
import { profilesStoreContext } from "../context";
import { EditProfile } from "./edit-profile";
import { Profile } from "../types";
import { localized, msg } from "@lit/localize";
import { sharedStyles } from "@holochain-open-dev/elements";

/**
 * A custom element that fires event on value change.
 *
 * @element create-profile
 * @emits profile-created - Emitted after the profile has been created. Detail will have this shape: { profile: { nickname, fields } }
 */
@localized()
export class CreateProfile extends ScopedElementsMixin(LitElement) {
  /**
   * @internal
   */
  @consume({ context: profilesStoreContext, subscribe: true })
  @state()
  _store!: ProfilesStore;

  /** Private properties */

  async createProfile(profile: Profile) {
    await this._store.client.createProfile(profile);

    this.dispatchEvent(
      new CustomEvent("profile-created", {
        detail: {
          profile,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      <div class="column" style="margin: 16px;">
        <edit-profile
          .saveProfileLabel=${msg("Create Profile")}
          @save-profile=${(e: CustomEvent) =>
            this.createProfile(e.detail.profile)}
        ></edit-profile>
      </div>
    `;
  }

  /**
   * @ignore
   */
  static get scopedElements() {
    return {
      "edit-profile": EditProfile,
    };
  }
  static get styles() {
    return [sharedStyles];
  }
}
