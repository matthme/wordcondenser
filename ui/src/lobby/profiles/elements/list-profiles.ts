import { css, html, LitElement } from "lit";
import { AgentPubKey, AgentPubKeyB64, encodeHashToBase64 } from "@holochain/client";
import { customElement, state } from "lit/decorators.js";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { consume } from "@lit-labs/context";
import { ListItem, List } from "@scoped-elements/material-web";
import { DisplayError, sharedStyles } from "@holochain-open-dev/elements";
import { StoreSubscriber } from "@holochain-open-dev/stores";
import { localized, msg } from "@lit/localize";

import { ProfilesStore } from "../profiles-store";
import { profilesStoreContext } from "../context";
import { AgentAvatar } from "./agent-avatar";
import { Profile } from "../types";

/**
 * @element list-profiles
 * @fires agent-selected - Fired when the user selects an agent from the list. Detail will have this shape: { agentPubKey: <AGENT_PUB_KEY as Uint8Array> }
 */
@localized()
@customElement('list-profiles')
export class ListProfiles extends ScopedElementsMixin(LitElement) {
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
  private _allProfiles = new StoreSubscriber(
    this,
    () => this._store.allProfiles
  );

  @state()
  _expandedProfiles: AgentPubKeyB64[] = [];

  initials(nickname: string): string {
    return nickname
      .split(" ")
      .map((name) => name[0])
      .join("");
  }

  selectProfile(agentPubKey: AgentPubKey) {
    if (agentPubKey) {
      this.dispatchEvent(
        new CustomEvent("agent-selected", {
          bubbles: true,
          composed: true,
          detail: {
            agentPubKey,
          },
        })
      );

      const pubKeyB64 = encodeHashToBase64(agentPubKey);

      if (this._expandedProfiles.includes(pubKeyB64)) {
        const index = this._expandedProfiles.indexOf(pubKeyB64);
        this._expandedProfiles.splice(index, 1);
        this.shadowRoot?.getElementById(pubKeyB64)?.classList.add("invisible");
      } else {
        this._expandedProfiles.push(pubKeyB64);
        this.shadowRoot?.getElementById(pubKeyB64)?.classList.remove("invisible");
      }

    }
  }

  renderList(profiles: ReadonlyMap<AgentPubKey, Profile>) {
    if (profiles.size === 0)
      return html`
        <div style="font-size: 18px; color: #c5cded;">There are no profiles yet.</div>
        `;

    return html`
      <div
        style="min-width: 80px; flex: 1;"
        @selected=${(e: CustomEvent) =>
          this.selectProfile(Array.from(profiles.keys())[e.detail.index])}
      >
        ${Array.from(profiles.entries())
          .filter(([agent_pub_key, profile]) => encodeHashToBase64(agent_pub_key) !== encodeHashToBase64(this._store.client.cellId[1]))
          .map(
          ([agent_pub_key, profile]) => html`
            <div
                class="column profile" style="min-width: 450px; align-items: flex-start;"
                @click=${() => this.selectProfile(agent_pub_key)}
                @keypress=${() => this.selectProfile(agent_pub_key)}
            >
              <div
                class="row"
                style="align-items: center; justify-content: flex-start;"
                tabindex="0"
              >
                ${
                  profile.fields["avatar"]
                  ? html`<img style="height: 70px; width: 70px; border-radius: 20px;" src=${profile.fields["avatar"]}>`
                  : html`<div style="height: 70px; width: 70px; border-radius: 20px; background: #c5cded"></div>`
                }
                <span style="font-size: 23px; color: #c5cded; margin-left: 20px;">${profile.nickname}</span>
              </div>
              <div id=${encodeHashToBase64(agent_pub_key)} class="invisible" style="font-size: 20px; color: #c5cded; margin-top: 15px; margin-left: 15px;">
                ${profile.fields["bio"]}
              </div>
            </div>
          `
        )}
      </div>
    `;
  }

  render() {
    switch (this._allProfiles.value.status) {
      case "pending":
        return html`
          <div class="column center-content">
            <div style="font-size: 18px; color: #c5cded;">loading...</div>
          </div>
          `;
      case "error":
        return html`
          <div class="column center-content">
            <div style="font-size: 20px; color: #c5cded; font-weight: bold; margin-bottom: 30px;">Error:</div>
            <div style="font-size: 18px; color: #c5cded; font-weight: bold; margin-bottom: 30px;">
              ${this._allProfiles.value.error.data.data}
            </div>
          </div>
          `;
      case "complete":
        return this.renderList(this._allProfiles.value.value);
    }
  }

  static styles = [
    sharedStyles,
    css`
      :host {
        display: flex;
      }

      .profile {
        border-radius: 15px;
        padding: 10px;
        cursor: pointer;
        margin: 5px;
      }

      .profile:hover {
        background: #c5cded38;
      }

      .invisible {
        display: none;
      }
    `,
  ];

  /**
   * @ignore
   */
  static get scopedElements() {
    return {
      "agent-avatar": AgentAvatar,
    };
  }
}
