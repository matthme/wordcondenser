import { LitElement, html, css } from 'lit';
import { state, customElement } from 'lit/decorators.js';


import { sharedStyles } from './sharedStyles';

import { localized } from '@lit/localize';


@localized()
@customElement('no-cookies-ever')
export class NoCookiesEver extends LitElement {


  render() {
    return html`
      <div class="column" style="align-items: center; max-width: 1100px; flex: 1; margin: auto;">

        <h2>Wait...no one asked me to accept Cookies?!</h2>

        <div class="section">Your data is yours on Holochain. If someone starts tracking you in any way, let the world know <b><i>and better, tracking-free alternatives will pop up in a matter no time</i></b>.
         <br><br>For this it is important that you only use Holochain apps that are open source so that people out there can
         check the integrity of the stuff that your computer is running on your behalf.</div>

        <div class="section">The only Cookies needed if desired are those real and tasty ones that you are nibbling in front
          of your screen while enjoying the cozy warm feeling of being in full agency about what and with whom you feel appropriate
           to share whatever you do in our shared realm of internet based communication.</div>

      <div
        class="confirm-btn"
        style="align-items: center; margin-top: 30px; margin-bottom: 80px;"
        tabindex="0"
        @click=${async () => {
            this.dispatchEvent(new CustomEvent('accepted-to-not-ever-need-to-accept-cookies', {
              composed: true,
              bubbles: true,
            }));
          }}
          @keypress=${async () => {
            this.dispatchEvent(new CustomEvent('accepted-to-not-ever-need-to-accept-cookies', {
              composed: true,
              bubbles: true,
            }));
          }}
      >
        <span style="color: #abb5d6; font-size: 1em;">Accept to not need to accept Cookies</span>
      </div>

    </div>
  `;
  }



  static styles = [
    sharedStyles,
    css`

    .section {
      color: #bfc5de;
      font-size: 0.95em;
      text-align: left;
      margin-bottom: 40px;
      line-height: 1.25em;
      width: 100%;
    }


    h2 {
      color: #929ab9;
      margin-top: 100px;
      margin-bottom: 80px;
    }

    h3 {
      color: #929ab9;
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


    `
  ];


}
