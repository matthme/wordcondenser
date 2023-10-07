import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { localized, msg } from '@lit/localize';
import { consume } from '@lit-labs/context';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import { DisplayError, sharedStyles } from '@holochain-open-dev/elements';

import { CreateProfile } from './create-profile';
import { ProfilesStore } from '../profiles-store';
import { profilesStoreContext } from '../context';
import { Profile } from '../types';

import '../../../loading-animation.js';

/**
 * @element profile-prompt
 * @slot hero - Will be displayed above the create-profile form when the user is prompted with it
 */
@localized()
@customElement('profile-prompt')
export class ProfilePrompt extends ScopedElementsMixin(LitElement) {
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
  private _myProfile = new StoreSubscriber(this, () => this._store.myProfile);

  renderPrompt(myProfile: Profile | undefined) {
    if (myProfile) return html`<slot></slot>`;

    return html`
      <div
        class="column"
        style="align-items: center; justify-content: center; flex: 1; padding-bottom: 10px;"
      >
        <div class="column" style="align-items: center;">
          <slot name="hero"></slot>
          <create-profile></create-profile>
        </div>
      </div>
    `;
  }

  render() {
    switch (this._myProfile.value.status) {
      case 'pending':
        return html` <div
          class="column"
          style="align-items: center; justify-content: center; flex: 1;"
        >
          <loading-animation indeterminate></loading-animation>
        </div>`;
      case 'complete':
        return this.renderPrompt(this._myProfile.value.value);
      case 'error':
        return html`<display-error
          .error=${this._myProfile.value.error}
        ></display-error> `;
      default:
        return html`Invalid AyncReadable state.`;
    }
  }

  /**
   * @ignore
   */
  static get scopedElements() {
    return {
      'display-error': DisplayError,
      'create-profile': CreateProfile,
    };
  }

  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          display: flex;
          flex: 1;
        }
      `,
    ];
  }
}
