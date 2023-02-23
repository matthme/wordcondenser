import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { css, html, LitElement } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { localized, msg, str } from "@lit/localize";
import { consume } from "@lit-labs/context";

import { ProfilesStore } from "../profiles-store";
import { profilesStoreContext } from "../context";
import { Profile } from "../types";
import { resizeAndExport } from "./utils/image";
import { sharedStyles } from "@holochain-open-dev/elements";

import '../../../components/mvb-textfield';
import '../../../components/mvb-textarea';
import { MVBTextField } from "../../../components/mvb-textfield";
import { MVBTextArea } from "../../../components/mvb-textarea";

/**
 * @element edit-profile
 * @fires save-profile - Fired when the save profile button is clicked
 */
@localized()
@customElement('edit-profile')
export class EditProfile extends ScopedElementsMixin(LitElement) {
  /**
   * The profile to be edited.
   */
  @property({ type: Object })
  profile: Profile | undefined;

  /**
   * Label for the save profile button.
   */
  @property({ type: String, attribute: "save-profile-label" })
  saveProfileLabel: string | undefined;

  /** Dependencies */

  /**
   * @internal
   */
  @consume({ context: profilesStoreContext, subscribe: true })
  @state()
  _store!: ProfilesStore;

  @property({ type: Boolean })
  allowCancel = false;

  /** Private properties */

  /**
   * @internal
   */
  @query("#nickname-field")
  private _nicknameField!: MVBTextField;

    /**
   * @internal
   */
  @query("#bio-field")
  private _bioField!: MVBTextArea;

  /**
   * @internal
   */
  @query("#avatar-file-picker")
  private _avatarFilePicker!: HTMLInputElement;

  /**
   * @internal
   */
  @state()
  private _avatar: string | undefined;

  /**
   * @internal
   */
  @state()
  private _bio: string | undefined;

  /**
   * @internal
   */
  @state()
  private _nickName: string | undefined;

  firstUpdated() {
    this._avatar = this.profile?.fields["avatar"];
    this._nickName = this.profile?.nickname;
    this._bio = this.profile?.fields["bio"];

    setTimeout(() => {
      if (this._nickName) {
        this._nicknameField.setValue(this._nickName);
      }

      if (this._bio) {
        this._bioField.setValue(this._bio);
      }
    }, 100);
  }

  isNickNameValid() {
    return this._nickName && this._nickName?.length >= 3 && this._nickName.length < 50;
  }

  onAvatarUploaded() {
    if (this._avatarFilePicker.files && this._avatarFilePicker.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          this._avatar = resizeAndExport(img);
          this._avatarFilePicker.value = "";
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(this._avatarFilePicker.files[0]);
    }
  }

  avatarMode() {
    return (
      this._store.config.avatarMode === "avatar-required" ||
      this._store.config.avatarMode === "avatar-optional"
    );
  }


  shouldSaveButtonBeEnabled() {
    if (!this._nicknameField) return false;
    if (!this.isNickNameValid()) return false;
    if (this._store.config.avatarMode === "avatar-required" && !this._avatar)
      return false;

    return true;
  }


  saveProfile() {
    const nickname = this._nicknameField.value;

    const fields: Record<string, string> = {};
    if (this._avatar) {
      fields["avatar"] = this._avatar;
    }
    if (this._bio) {
      fields["bio"] = this._bio;
    }

    const profile: Profile = {
      fields,
      nickname,
    };

    this.dispatchEvent(
      new CustomEvent("save-profile", {
        detail: {
          profile,
        },
        bubbles: true,
        composed: true,
      })
    );

    window.scrollTo(0,0);
  }

  cancel() {
    this.dispatchEvent(
      new CustomEvent("cancel-edit-profile", {
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      ${
        this.avatarMode()
          ? html`<input
              type="file"
              id="avatar-file-picker"
              style="display: none;"
              @change=${this.onAvatarUploaded}
            />`
          : html``
      }
        <div class="column" style="align-items: center;">

          <mvb-textfield
            id="nickname-field"
            outlined
            .placeholder=${msg("Nickname (min. 3 characters)")}
            style="
              margin-bottom: 15px;
              --mvb-primary-color: #abb5d6;
              --mvb-secondary-color: #838ba4;
              --mvb-textfield-width: 800px;
              --mvb-textfield-height: 56px;
            "
            @input=${(e: CustomEvent) => {
              this._nickName = (e.target as any).value;
            } }
          ></mvb-textfield>

          <mvb-textarea
            id="bio-field"
            .placeholder=${msg("(Optional) A little something about you...")}
            style="
              --mvb-primary-color: #abb5d6;
              --mvb-secondary-color: #838ba4;
              margin-bottom: 30px;
            "
            @input=${(e: CustomEvent) => {
              this._bio = (e.target as any).value;
            } }
            cols="57"
          ></mvb-textarea>


          <div style="font-size: 19px; line-height: 30px; color: #c5cded; margin-bottom: 20px; max-width: 800px; text-align: left;">
            (Optional) Choose a profile picture:
          </div>
          <input
              type="file"
              id="image-file-picker"
              style="display: none"
              accept="image/*"
              @change=${this.onAvatarUploaded}
          />
          <div class="row" style="align-items: center;">
            <button @click=${() => this._avatarFilePicker.click()}>Browse Files...</button>
            ${
              this._avatar
                ? html`<button @click=${() => this._avatar = undefined}>Remove</button>`
                : html``
            }
          </div>

          <div style="margin-bottom: 50px;">
            ${
              this._avatar
                ? html`<img src=${this._avatar ? this._avatar : ""} style="height: 200px; width: 200px; border-radius: 40px; margin-top: 20px;"/>`
                : html``
            }
          </div>


          <div class="row" style="margin-top: 8px; align-items: center;">

            ${
              this.allowCancel
                ? html`
                  <div
                    class="row cancel-btn"
                    style="align-items: center; margin-top: 5px; margin-right: 20px;"
                    @click=${() => this.cancel()}
                    @keypress=${() => this.cancel()}
                    tabindex="0"
                  >
                    <span style="color: #cd2b2b; font-size: 23px;">${msg("Cancel")}</span>
                  </div>
                  `
                : html``
            }

            <div
              class="row ${this.shouldSaveButtonBeEnabled() ? "create-btn" : "disabled"}"
              style="align-items: center; margin-top: 5px;"
              @click=${() => this.shouldSaveButtonBeEnabled() ? this.saveProfile() : undefined}
              @keypress=${() => this.shouldSaveButtonBeEnabled() ? this.saveProfile() : undefined}
              tabindex="0"
            >
              <span style="color: #abb5d6; font-size: 23px;">${this.saveProfileLabel}</span>
            </div>

          </div>

        </div>
    `;
  }

  /**
   * @ignore
   */
  static get scopedElements() {
    return {
    };
  }

  static styles = [sharedStyles, css`

    .disabled {
      background: #abb5d61d;
      border-radius: 10px;
      padding: 8px 15px;
      cursor: pointer;
      opacity: 0.5;
    }

    .create-btn {
      background: #abb5d61d;
      border-radius: 10px;
      padding: 8px 15px;
      cursor: pointer;
    }

    .create-btn:hover {
      background: #abb5d638;
      border-radius: 10px;
      padding: 8px 15px;
    }

    .cancel-btn {
      background: #9e1e1e71;
      border-radius: 10px;
      padding: 8px 15px;
      cursor: pointer;
    }

    .cancel-btn:hover {
      background: #9e1e1e9d;
      border-radius: 10px;
      padding: 8px 15px;
    }

  `];
}
