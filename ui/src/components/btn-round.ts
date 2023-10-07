import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { sharedStyles } from '../sharedStyles';

@customElement('btn-round')
export class BtnRound extends LitElement {
  @property() disabled = false;

  render() {
    return html`
      <button
        class="row btn varholder ${classMap({
          btnDisabled: this.disabled,
          btn: !this.disabled,
        })}"
        @click=${(e: Event) => {
          if (this.disabled) {
            e.stopPropagation();
          }
        }}
      >
        <slot></slot>
      </button>
    `;
  }

  static styles = [
    sharedStyles,
    css`
      .varholder {
        --default-primary-color: #9098b3;
        --default-secondary-color: #6f758a;
        --default-disabled-color: #8c91a2;
        --default-text-color: #576592;
        --default-disabled-text-color: #7c87ad;
      }

      .btn {
        all: unset;
        cursor: pointer;
        color: #9ba4c2;
        width: intrinsic;
        padding: 10px 20px;
        border: 1px solid #9ba4c2;
        border-radius: 30px;
        text-align: center;
      }

      .btn:hover {
        background-color: #9ba4c221;
        /* border: 1px solid transparent; */
      }

      .btn:focus-visible {
        /* to be changed */
        background-color: #9ba4c221;
        border: 1px solid #6e7691;
      }

      .btnDisabled {
        all: unset;
        cursor: pointer;
        color: #535a73;
        width: intrinsic;
        padding: 10px 20px;
        border: 1px solid #535a73;
        border-radius: 30px;
        text-align: center;
      }

      .btnDisabled:hover {
        background-color: transparent;
      }
    `,
  ];
}
